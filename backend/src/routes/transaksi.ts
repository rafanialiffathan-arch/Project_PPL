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
// Sprint 3A: status TIDAK lagi di-set dari request body.
uploadRouter.put('/:id', requirePermission('manage_transaksi') as any, uploadMiddleware, async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, tanggal, nomor_invoice } = req.body;
  const file = req.file;

  if (!keterangan || !jumlah || !tipe || !tanggal) {
    res.status(400).json({ message: 'Field wajib: keterangan, jumlah, tipe, tanggal' });
    return;
  }

  try {
    const buktiPath = file ? `/uploads/${file.filename}` : null;
    
    // Update dengan bukti jika ada
    let query = `UPDATE transaksi
       SET keterangan = ?, jumlah = ?, tipe = ?, kategori = ?, tanggal = ?, nomor_invoice = ?`;
    let params = [keterangan, jumlah, tipe, kategori || 'umum', tanggal, nomor_invoice || null];
    
    if (buktiPath) {
      query += ', bukti_transaksi = ?';
      params.push(buktiPath);
    }

    const isAdmin = req.user?.role === 'admin_sistem' || req.user?.role === 'admin';
    query += ' WHERE id = ?' + (isAdmin ? '' : ' AND user_id = ?');
    params.push(req.params.id, ...(isAdmin ? [] : [req.user!.id]));

    const [result] = await pool.query(query, params) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan' });
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
    res.status(500).json({ message: 'Gagal update transaksi', error: err });
  }
});

// Export uploadRouter
export { uploadRouter };

// ==========================
// MAIN TRANSAKSI ROUTER (JSON)
// ==========================

// Semua route di bawah ini wajib login (ada token)
router.use(authMiddleware as any);

// GET /api/transaksi — ambil semua transaksi milik user yg login
router.get('/', async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM transaksi
       ORDER BY tanggal DESC, created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil transaksi', error: err });
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
router.put('/:id', requirePermission('manage_transaksi') as any, async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, tanggal, nomor_invoice } = req.body;
  // Sprint 3A: status TIDAK lagi di-set dari request body.
  // Perubahan status hanya boleh lewat endpoint /approve dan /reject.

  if (!keterangan || !jumlah || !tipe || !tanggal) {
    res.status(400).json({ message: 'Field wajib: keterangan, jumlah, tipe, tanggal' });
    return;
  }

  try {
    const isAdmin = req.user?.role === 'admin_sistem' || req.user?.role === 'admin';
    const query = `UPDATE transaksi
       SET keterangan = ?, jumlah = ?, tipe = ?, kategori = ?, tanggal = ?, nomor_invoice = ?
       WHERE id = ?${isAdmin ? '' : ' AND user_id = ?'}`;
    const params = [keterangan, jumlah, tipe, kategori || 'umum', tanggal,
       nomor_invoice || null, req.params.id, ...(isAdmin ? [] : [req.user!.id])];
    const [result] = await pool.query(query, params) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan' });
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
    res.status(500).json({ message: 'Gagal update transaksi', error: err });
  }
});

// DELETE /api/transaksi/:id
router.delete('/:id', requirePermission('manage_transaksi') as any, async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.user?.role === 'admin_sistem' || req.user?.role === 'admin';
    const query = 'DELETE FROM transaksi WHERE id = ?' + (isAdmin ? '' : ' AND user_id = ?');
    const params = isAdmin ? [req.params.id] : [req.params.id, req.user!.id];
    const [result] = await pool.query(query, params) as any;
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }
    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus transaksi', error: err });
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