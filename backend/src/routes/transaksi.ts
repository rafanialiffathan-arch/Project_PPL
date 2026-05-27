import { Router } from 'express';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

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

// POST /api/transaksi — tambah transaksi baru
router.post('/', async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, status, tanggal } = req.body;

  if (!keterangan || !jumlah || !tipe || !tanggal) {
    res.status(400).json({ message: 'Field wajib: keterangan, jumlah, tipe, tanggal' });
    return;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO transaksi
         (user_id, keterangan, jumlah, tipe, kategori, status, tanggal)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user!.id, keterangan, jumlah, tipe,
       kategori || 'umum', status || 'pending', tanggal]
    ) as any;

    res.status(201).json({
      status: 'success',
      data: { id: result.insertId, keterangan, jumlah, tipe, tanggal }
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah transaksi', error: err });
  }
});

// PUT /api/transaksi/:id — update transaksi
router.put('/:id', async (req: AuthRequest, res) => {
  const { keterangan, jumlah, tipe, kategori, status, tanggal } = req.body;

  if (!keterangan || !jumlah || !tipe || !tanggal) {
    res.status(400).json({ message: 'Field wajib: keterangan, jumlah, tipe, tanggal' });
    return;
  }

  try {
    const [result] = await pool.query(
      `UPDATE transaksi 
       SET keterangan = ?, jumlah = ?, tipe = ?, kategori = ?, status = ?, tanggal = ?
       WHERE id = ? AND user_id = ?`,
      [keterangan, jumlah, tipe, kategori || 'umum', status || 'pending', tanggal, 
       req.params.id, req.user!.id]
    ) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Transaksi tidak ditemukan' });
      return;
    }

    res.json({
      status: 'success',
      data: { id: req.params.id, keterangan, jumlah, tipe, kategori, status, tanggal }
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
