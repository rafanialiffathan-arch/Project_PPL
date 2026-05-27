import { Router } from 'express';
import pool from '../config/db';
import multer from 'multer';
import path from 'path';
import { authMiddleware, AuthRequest } from '../middleware/auth';

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
uploadRouter.post('/', uploadMiddleware, async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, status, tanggal, nomor_invoice } = req.body;
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
       kategori || 'umum', status || 'pending', tanggal, 
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
uploadRouter.put('/:id', uploadMiddleware, async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, status, tanggal, nomor_invoice } = req.body;
  const file = req.file;

  if (!keterangan || !jumlah || !tipe || !tanggal) {
    res.status(400).json({ message: 'Field wajib: keterangan, jumlah, tipe, tanggal' });
    return;
  }

  try {
    const buktiPath = file ? `/uploads/${file.filename}` : null;
    
    // Update dengan bukti jika ada
    let query = `UPDATE transaksi 
       SET keterangan = ?, jumlah = ?, tipe = ?, kategori = ?, status = ?, tanggal = ?, nomor_invoice = ?`;
    let params = [keterangan, jumlah, tipe, kategori || 'umum', status || 'pending', tanggal, nomor_invoice || null];
    
    if (buktiPath) {
      query += ', bukti_transaksi = ?';
      params.push(buktiPath);
    }
    
    query += ' WHERE id = ? AND user_id = ?';
    params.push(req.params.id, req.user!.id);

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
        status, 
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
       WHERE user_id = ?
       ORDER BY tanggal DESC, created_at DESC`,
      [req.user!.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil transaksi', error: err });
  }
});

// POST /api/transaksi — tambah transaksi baru (JSON)
router.post('/', async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, status, tanggal, nomor_invoice } = req.body;

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
       kategori || 'umum', status || 'pending', tanggal, nomor_invoice || null]
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
router.put('/:id', async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, status, tanggal, nomor_invoice } = req.body;

  if (!keterangan || !jumlah || !tipe || !tanggal) {
    res.status(400).json({ message: 'Field wajib: keterangan, jumlah, tipe, tanggal' });
    return;
  }

  try {
    const [result] = await pool.query(
      `UPDATE transaksi 
       SET keterangan = ?, jumlah = ?, tipe = ?, kategori = ?, status = ?, tanggal = ?, nomor_invoice = ?
       WHERE id = ? AND user_id = ?`,
      [keterangan, jumlah, tipe, kategori || 'umum', status || 'pending', tanggal, 
       nomor_invoice || null, req.params.id, req.user!.id]
    ) as any;

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
        status, 
        tanggal,
        nomor_invoice: nomor_invoice || null
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update transaksi', error: err });
  }
});

// DELETE /api/transaksi/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await pool.query(
      'DELETE FROM transaksi WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.id]
    );
    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus transaksi', error: err });
  }
});

export default router;