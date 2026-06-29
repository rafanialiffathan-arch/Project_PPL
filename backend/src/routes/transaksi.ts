import { Router } from 'express';
import pool from '../config/db';
import multer from 'multer';
import path from 'path';
import { authMiddleware, AuthRequest, requirePermission } from '../middleware/auth';

const router = Router();

// ==========================
// MULTER CONFIG (FILE UPLOAD)
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `bukti-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Hanya file PDF, JPG, PNG yang diizinkan!'));
  }
});

// Export multer middleware untuk penggunaan di tempat lain
export const uploadMiddleware = upload.single('bukti_transaksi');

// ==========================
// UPLOAD ROUTER (multipart/form-data)
// ==========================
const uploadRouter = Router();

uploadRouter.use(authMiddleware as any);

// POST /api/transaksi/upload — upload transaksi baru dengan bukti
// Sprint 3A: status SELALU 'pending' saat create, diabaikan dari body.
uploadRouter.post('/', requirePermission('manage_transaksi') as any, uploadMiddleware, async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, tanggal, nomor_invoice } = req.body;
  const file = req.file;

  if (!keterangan || !jumlah || !tipe || !tanggal) {
    res.status(400).json({ message: 'Field wajib: keterangan, jumlah, tipe, tanggal' });
    return;
  }

  try {
    const buktiPath = file ? `/uploads/${file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO transaksi
         (user_id, keterangan, jumlah, tipe, kategori, status, tanggal, nomor_invoice, bukti_transaksi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user!.id, keterangan, jumlah, tipe,
       kategori || 'umum', 'pending', tanggal,
       nomor_invoice || null, buktiPath]
    ) as any;

    res.status(201).json({
      status: 'success',
      data: { 
        id: result.insertId, 
        keterangan, 
        jumlah, 
        tipe, 
        tanggal,
        nomor_invoice: nomor_invoice || null,
        bukti_transaksi: buktiPath
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah transaksi', error: err });
  }
});

// PUT /api/transaksi/upload/:id — update transaksi dengan bukti baru
// Sprint 3A : status TIDAK di-set dari body.
// Sprint 3C.1 Write Lock: hanya transaksi berstatus 'pending' yang boleh diubah (Decision 8).
uploadRouter.put('/:id', requirePermission('manage_transaksi') as any, uploadMiddleware, async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, tanggal, nomor_invoice } = req.body;
  const file = req.file;

  if (!keterangan || !jumlah || !tipe || !tanggal) {
    res.status(400).json({ message: 'Field wajib: keterangan, jumlah, tipe, tanggal' });
    return;
  }

  try {
    // --- Write Lock: cek status sebelum update ---
    const [existing]: any = await pool.query(
      'SELECT id, status FROM transaksi WHERE id = ?',
      [req.params.id]
    );
    if (existing.length === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan' });
      return;
    }
    if (existing[0].status !== 'pending') {
      res.status(400).json({
        message: `Transaksi tidak dapat diubah karena status saat ini adalah '${existing[0].status}'. Hanya transaksi berstatus 'pending' yang dapat diedit.`
      });
      return;
    }

    const buktiPath = file ? `/uploads/${file.filename}` : null;

    let query = `UPDATE transaksi
       SET keterangan = ?, jumlah = ?, tipe = ?, kategori = ?, tanggal = ?, nomor_invoice = ?`;
    let params: unknown[] = [keterangan, jumlah, tipe, kategori || 'umum', tanggal, nomor_invoice || null];

    if (buktiPath) {
      query += ', bukti_transaksi = ?';
      params.push(buktiPath);
    }

    const isAdmin = req.user?.role === 'admin_sistem' || req.user?.role === 'admin';
    query += ' WHERE id = ?' + (isAdmin ? '' : ' AND user_id = ?');
    params.push(req.params.id, ...(isAdmin ? [] : [req.user!.id]));

    const [result] = await pool.query(query, params) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan atau bukan milik Anda' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        id: req.params.id,
        keterangan,
        jumlah,
        tipe,
        kategori,
        tanggal,
        nomor_invoice: nomor_invoice || null,
        bukti_transaksi: buktiPath
      }
    });
  } catch (err) {
    console.error('PUT upload transaksi error:', err);
    res.status(500).json({ message: 'Gagal update transaksi' });
  }
});

// Export uploadRouter
export { uploadRouter };

// ==========================
// MAIN TRANSAKSI ROUTER (JSON)
// ==========================

// Semua route di bawah ini wajib login (ada token)
router.use(authMiddleware as any);

// GET /api/transaksi/summary — ringkasan keuangan resmi (Sprint 3C.1)
// WAJIB dideklarasikan SEBELUM router.get('/') agar Express tidak menelan ':id'.
// Permission wajib: view_reports (dimiliki admin_sistem, pimpinan, pengelola_internal).
// Official = status IN ('approved','valid') — Decision 6 / ADR-005 / formula Falah.
// Query param opsional: start_date, end_date (YYYY-MM-DD).
// Response default 0 / [] bila tidak ada data (tidak pernah null/undefined).
router.get('/summary', requirePermission('view_reports') as any, async (req: AuthRequest, res) => {
  const rawStart = (req.query.start_date as string | undefined)?.trim();
  const rawEnd   = (req.query.end_date   as string | undefined)?.trim();

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (rawStart && (!DATE_RE.test(rawStart) || isNaN(Date.parse(rawStart)))) {
    res.status(400).json({ message: `Format start_date tidak valid: "${rawStart}". Gunakan YYYY-MM-DD.` });
    return;
  }
  if (rawEnd && (!DATE_RE.test(rawEnd) || isNaN(Date.parse(rawEnd)))) {
    res.status(400).json({ message: `Format end_date tidak valid: "${rawEnd}". Gunakan YYYY-MM-DD.` });
    return;
  }
  if (rawStart && rawEnd && rawStart > rawEnd) {
    res.status(400).json({ message: 'start_date tidak boleh lebih besar dari end_date.' });
    return;
  }

  // Bangun klausa tanggal untuk dipakai di semua query
  const dateConditions: string[] = [];
  const dateParams:     unknown[] = [];
  if (rawStart) { dateConditions.push('tanggal >= ?'); dateParams.push(rawStart); }
  if (rawEnd)   { dateConditions.push('tanggal <= ?'); dateParams.push(rawEnd);   }
  const dateWhere = dateConditions.length ? `AND ${dateConditions.join(' AND ')}` : '';

  try {
    // ----------------------------------------------------------------
    // 1. Official totals: income, expense, net, count
    //    official = status IN ('approved','valid')  — Decision 6
    // ----------------------------------------------------------------
    const [officialRows]: any = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN tipe = 'pemasukan'  THEN jumlah ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN tipe = 'pengeluaran' THEN jumlah ELSE 0 END), 0) AS expense,
         COUNT(*) AS count
       FROM transaksi
       WHERE status IN ('approved','valid') ${dateWhere}`,
      dateParams
    );
    const income  = Number(officialRows[0].income)  || 0;
    const expense = Number(officialRows[0].expense) || 0;
    const official = {
      income,
      expense,
      net:   income - expense,
      count: Number(officialRows[0].count) || 0
    };

    // ----------------------------------------------------------------
    // 2. Monthly breakdown (official only)
    //    Format bulan: YYYY-MM
    // ----------------------------------------------------------------
    const [monthlyRows]: any = await pool.query(
      `SELECT
         DATE_FORMAT(tanggal, '%Y-%m') AS month,
         COALESCE(SUM(CASE WHEN tipe = 'pemasukan'  THEN jumlah ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN tipe = 'pengeluaran' THEN jumlah ELSE 0 END), 0) AS expense,
         COUNT(*) AS count
       FROM transaksi
       WHERE status IN ('approved','valid') ${dateWhere}
       GROUP BY DATE_FORMAT(tanggal, '%Y-%m')
       ORDER BY month ASC`,
      dateParams
    );
    const monthly = (monthlyRows as any[]).map(r => ({
      month:   r.month,
      income:  Number(r.income)  || 0,
      expense: Number(r.expense) || 0,
      net:     (Number(r.income) || 0) - (Number(r.expense) || 0),
      count:   Number(r.count)   || 0
    }));

    // ----------------------------------------------------------------
    // 3. Category breakdown (official only)
    // ----------------------------------------------------------------
    const [catRows]: any = await pool.query(
      `SELECT
         COALESCE(kategori, 'umum') AS kategori,
         COALESCE(SUM(CASE WHEN tipe = 'pemasukan'  THEN jumlah ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN tipe = 'pengeluaran' THEN jumlah ELSE 0 END), 0) AS expense,
         COUNT(*) AS count
       FROM transaksi
       WHERE status IN ('approved','valid') ${dateWhere}
       GROUP BY COALESCE(kategori, 'umum')
       ORDER BY kategori ASC`,
      dateParams
    );
    const by_category = (catRows as any[]).map(r => ({
      kategori: r.kategori,
      income:   Number(r.income)  || 0,
      expense:  Number(r.expense) || 0,
      net:      (Number(r.income) || 0) - (Number(r.expense) || 0),
      count:    Number(r.count)   || 0
    }));

    // ----------------------------------------------------------------
    // 4. Pending count (monitoring saja, bukan angka resmi)
    // ----------------------------------------------------------------
    const [pendingRows]: any = await pool.query(
      `SELECT COUNT(*) AS count FROM transaksi WHERE status = 'pending' ${dateWhere}`,
      dateParams
    );

    // ----------------------------------------------------------------
    // 5. Rejected count (histori audit, tidak masuk angka resmi)
    // ----------------------------------------------------------------
    const [rejectedRows]: any = await pool.query(
      `SELECT COUNT(*) AS count FROM transaksi WHERE status = 'rejected' ${dateWhere}`,
      dateParams
    );

    res.json({
      official,
      monthly,
      by_category,
      pending:  { count: Number(pendingRows[0].count)  || 0 },
      rejected: { count: Number(rejectedRows[0].count) || 0 }
    });
  } catch (err) {
    console.error('GET transaksi/summary error:', err);
    res.status(500).json({ message: 'Gagal mengambil ringkasan transaksi' });
  }
});

// GET /api/transaksi — company-wide read dengan filter status & tanggal (Sprint 3C.1)
// Permission wajib: view_pembukuan (dimiliki admin_sistem, pimpinan, pengelola_internal).
// Query param opsional:
//   status  : pending | approved | rejected | valid | all  (default: all)
//             "approved" secara resmi = approved + valid (legacy), sesuai Decision 6 / ADR-005.
//   start_date : YYYY-MM-DD
//   end_date   : YYYY-MM-DD
// Response: array transaksi (tidak dibungkus) — backward-compatible dengan consumer existing.
router.get('/', requirePermission('view_pembukuan') as any, async (req: AuthRequest, res) => {
  // --- Validasi query param status ---
  const VALID_STATUSES = ['pending', 'approved', 'rejected', 'valid', 'all'] as const;
  type StatusParam = typeof VALID_STATUSES[number];

  const rawStatus  = (req.query.status    as string | undefined)?.trim().toLowerCase();
  const rawStart   = (req.query.start_date as string | undefined)?.trim();
  const rawEnd     = (req.query.end_date   as string | undefined)?.trim();

  if (rawStatus && !VALID_STATUSES.includes(rawStatus as StatusParam)) {
    res.status(400).json({
      message: `Parameter status tidak valid: "${rawStatus}". Nilai yang diizinkan: ${VALID_STATUSES.join(', ')}.`
    });
    return;
  }

  // --- Validasi format tanggal (YYYY-MM-DD) ---
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (rawStart && (!DATE_RE.test(rawStart) || isNaN(Date.parse(rawStart)))) {
    res.status(400).json({ message: `Format start_date tidak valid: "${rawStart}". Gunakan format YYYY-MM-DD.` });
    return;
  }
  if (rawEnd && (!DATE_RE.test(rawEnd) || isNaN(Date.parse(rawEnd)))) {
    res.status(400).json({ message: `Format end_date tidak valid: "${rawEnd}". Gunakan format YYYY-MM-DD.` });
    return;
  }
  if (rawStart && rawEnd && rawStart > rawEnd) {
    res.status(400).json({ message: 'start_date tidak boleh lebih besar dari end_date.' });
    return;
  }

  try {
    // --- Bangun klausa WHERE secara dinamis ---
    const conditions: string[] = [];
    const params:     unknown[] = [];

    // Filter status:
    // - "approved" (resmi) mencakup status 'approved' DAN 'valid' (legacy), sesuai Decision 6.
    // - "all" atau tidak diisi = tanpa filter status.
    if (rawStatus && rawStatus !== 'all') {
      if (rawStatus === 'approved') {
        conditions.push(`status IN ('approved', 'valid')`);
      } else {
        conditions.push(`status = ?`);
        params.push(rawStatus);
      }
    }

    if (rawStart) { conditions.push(`tanggal >= ?`); params.push(rawStart); }
    if (rawEnd)   { conditions.push(`tanggal <= ?`); params.push(rawEnd);   }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT * FROM transaksi ${whereClause} ORDER BY tanggal DESC, created_at DESC`,
      params
    );

    // Response tetap array langsung — tidak dibungkus — agar backward-compatible.
    res.json(rows);
  } catch (err) {
    console.error('GET transaksi error:', err);
    res.status(500).json({ message: 'Gagal mengambil transaksi' });
  }
});

// POST /api/transaksi — tambah transaksi baru (JSON)
// Sprint 3A: status SELALU 'pending' saat create, diabaikan dari body.
router.post('/', requirePermission('manage_transaksi') as any, async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, tanggal, nomor_invoice } = req.body;

  if (!keterangan || !jumlah || !tipe || !tanggal) {
    res.status(400).json({ message: 'Field wajib: keterangan, jumlah, tipe, tanggal' });
    return;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO transaksi
         (user_id, keterangan, jumlah, tipe, kategori, status, tanggal, nomor_invoice)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user!.id, keterangan, jumlah, tipe,
       kategori || 'umum', 'pending', tanggal, nomor_invoice || null]
    ) as any;

    res.status(201).json({
      status: 'success',
      data: { 
        id: result.insertId, 
        keterangan, 
        jumlah, 
        tipe, 
        tanggal,
        nomor_invoice: nomor_invoice || null
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah transaksi', error: err });
  }
});

// PUT /api/transaksi/:id — update transaksi (JSON)
// Sprint 3A : status TIDAK di-set dari request body.
// Sprint 3C.1 Write Lock: hanya transaksi berstatus 'pending' yang boleh diubah (Decision 8).
router.put('/:id', requirePermission('manage_transaksi') as any, async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, tanggal, nomor_invoice } = req.body;

  if (!keterangan || !jumlah || !tipe || !tanggal) {
    res.status(400).json({ message: 'Field wajib: keterangan, jumlah, tipe, tanggal' });
    return;
  }

  try {
    // --- Write Lock: cek status sebelum update ---
    const [existing]: any = await pool.query(
      'SELECT id, status FROM transaksi WHERE id = ?',
      [req.params.id]
    );
    if (existing.length === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan' });
      return;
    }
    if (existing[0].status !== 'pending') {
      res.status(400).json({
        message: `Transaksi tidak dapat diubah karena status saat ini adalah '${existing[0].status}'. Hanya transaksi berstatus 'pending' yang dapat diubah.`
      });
      return;
    }

    const isAdmin = req.user?.role === 'admin_sistem' || req.user?.role === 'admin';
    const query = `UPDATE transaksi
       SET keterangan = ?, jumlah = ?, tipe = ?, kategori = ?, tanggal = ?, nomor_invoice = ?
       WHERE id = ?${isAdmin ? '' : ' AND user_id = ?'}`;
    const params: unknown[] = [keterangan, jumlah, tipe, kategori || 'umum', tanggal,
       nomor_invoice || null, req.params.id, ...(isAdmin ? [] : [req.user!.id])];
    const [result] = await pool.query(query, params) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan atau bukan milik Anda' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        id: req.params.id,
        keterangan,
        jumlah,
        tipe,
        kategori,
        tanggal,
        nomor_invoice: nomor_invoice || null
      }
    });
  } catch (err) {
    console.error('PUT transaksi error:', err);
    res.status(500).json({ message: 'Gagal update transaksi' });
  }
});

// DELETE /api/transaksi/:id
// Sprint 3C.1 Write Lock: hanya transaksi berstatus 'pending' yang boleh dihapus (Decision 8).
router.delete('/:id', requirePermission('manage_transaksi') as any, async (req: AuthRequest, res) => {
  try {
    // --- Write Lock: cek status sebelum delete ---
    const [existing]: any = await pool.query(
      'SELECT id, status FROM transaksi WHERE id = ?',
      [req.params.id]
    );
    if (existing.length === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan' });
      return;
    }
    if (existing[0].status !== 'pending') {
      res.status(400).json({
        message: `Transaksi tidak dapat dihapus karena status saat ini adalah '${existing[0].status}'. Hanya transaksi berstatus 'pending' yang dapat dihapus.`
      });
      return;
    }

    const isAdmin = req.user?.role === 'admin_sistem' || req.user?.role === 'admin';
    const query = 'DELETE FROM transaksi WHERE id = ?' + (isAdmin ? '' : ' AND user_id = ?');
    const params = isAdmin ? [req.params.id] : [req.params.id, req.user!.id];
    const [result] = await pool.query(query, params) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan atau bukan milik Anda' });
      return;
    }

    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (err) {
    console.error('DELETE transaksi error:', err);
    res.status(500).json({ message: 'Gagal menghapus transaksi' });
  }
});

// ==========================
// APPROVAL WORKFLOW (Sprint 3A)
// ==========================
// Hanya user dengan permission `approve_transaction` (pimpinan
// dan admin_sistem) yang boleh approve/reject. Transaksi yang
// status-nya bukan 'pending' tidak dapat di-approve/reject ulang.
// Setiap aksi menyimpan siapa user yang melakukannya dan kapan.
// ==========================

// PATCH /api/transaksi/:id/approve
// Body opsional: { approval_note?: string }
router.patch('/:id/approve', requirePermission('approve_transaction') as any, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const note = typeof req.body?.approval_note === 'string' ? req.body.approval_note.trim() : null;

  try {
    const [rows]: any = await pool.query(
      'SELECT id, status FROM transaksi WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({
        message: `Transaksi tidak dapat di-approve (status saat ini: ${rows[0].status})`
      });
    }

    // approval_note opsional: hanya ditulis jika dikirim.
    if (note) {
      await pool.query(
        `UPDATE transaksi
           SET status = 'approved',
               approved_by = ?,
               approved_at = NOW(),
               approval_note = ?
         WHERE id = ?`,
        [req.user!.id, note, id]
      );
    } else {
      await pool.query(
        `UPDATE transaksi
           SET status = 'approved',
               approved_by = ?,
               approved_at = NOW()
         WHERE id = ?`,
        [req.user!.id, id]
      );
    }

    const [updated]: any = await pool.query(
      'SELECT * FROM transaksi WHERE id = ?',
      [id]
    );

    return res.json({ status: 'success', data: updated[0] });
  } catch (err) {
    console.error('Approve transaksi error:', err);
    return res.status(500).json({ message: 'Gagal approve transaksi', error: err });
  }
});

// PATCH /api/transaksi/:id/reject
// Body WAJIB: { approval_note: string } (>= 3 karakter setelah trim)
router.patch('/:id/reject', requirePermission('approve_transaction') as any, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const rawNote = req.body?.approval_note;
  const note = typeof rawNote === 'string' ? rawNote.trim() : '';

  if (note.length < 3) {
    return res.status(400).json({
      message: 'approval_note wajib diisi (minimal 3 karakter)'
    });
  }

  try {
    const [rows]: any = await pool.query(
      'SELECT id, status FROM transaksi WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({
        message: `Transaksi tidak dapat di-reject (status saat ini: ${rows[0].status})`
      });
    }

    await pool.query(
      `UPDATE transaksi
         SET status = 'rejected',
             rejected_by = ?,
             rejected_at = NOW(),
             approval_note = ?
       WHERE id = ?`,
      [req.user!.id, note, id]
    );

    const [updated]: any = await pool.query(
      'SELECT * FROM transaksi WHERE id = ?',
      [id]
    );

    return res.json({ status: 'success', data: updated[0] });
  } catch (err) {
    console.error('Reject transaksi error:', err);
    return res.status(500).json({ message: 'Gagal reject transaksi', error: err });
  }
});

export default router;
