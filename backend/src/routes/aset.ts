import { Router } from 'express';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Semua route wajib login
router.use(authMiddleware as any);

// ==========================
// GET /api/aset — ambil semua aset tetap user
// ==========================
router.get('/', async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT *, 
        (nilai_aset - COALESCE(akumulasi_depresiasi, 0)) AS nilai_buku
       FROM aset_tetap
       WHERE user_id = ?
       ORDER BY tanggal_perolehan DESC, created_at DESC`,
      [req.user!.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data aset tetap', error: err });
  }
});

// ==========================
// GET /api/aset/:id — ambil 1 aset by ID
// ==========================
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT *, 
        (nilai_aset - COALESCE(akumulasi_depresiasi, 0)) AS nilai_buku
       FROM aset_tetap
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user!.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: 'Aset tidak ditemukan' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data aset', error: err });
  }
});

// ==========================
// POST /api/aset — tambah aset baru
// ==========================
router.post('/', async (req: AuthRequest, res) => {
  const { nama_aset, kategori, nilai_aset, tanggal_perolehan, umur_ekonomis, status } = req.body;

  // Validasi wajib
  if (!nama_aset || !nilai_aset || !tanggal_perolehan || !umur_ekonomis) {
    res.status(400).json({
      message: 'Field wajib: nama_aset, nilai_aset, tanggal_perolehan, umur_ekonomis'
    });
    return;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO aset_tetap
         (user_id, nama_aset, kategori, nilai_aset, tanggal_perolehan, umur_ekonomis, status, akumulasi_depresiasi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user!.id,
        nama_aset,
        kategori || 'lainnya',
        nilai_aset,
        tanggal_perolehan,
        umur_ekonomis,
        status || 'aktif',
        0  // akumulasi_depresiasi default 0
      ]
    ) as any;

    // Ambil data yang baru dibuat
    const [rows]: any = await pool.query(
      `SELECT *, (nilai_aset - COALESCE(akumulasi_depresiasi, 0)) AS nilai_buku
       FROM aset_tetap WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      status: 'success',
      data: rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah aset tetap', error: err });
  }
});

// ==========================
// PUT /api/aset/:id — update aset
// ==========================
router.put('/:id', async (req: AuthRequest, res) => {
  const { nama_aset, kategori, nilai_aset, tanggal_perolehan, umur_ekonomis, status, akumulasi_depresiasi } = req.body;

  // Validasi wajib
  if (!nama_aset || !nilai_aset || !tanggal_perolehan || !umur_ekonomis) {
    res.status(400).json({
      message: 'Field wajib: nama_aset, nilai_aset, tanggal_perolehan, umur_ekonomis'
    });
    return;
  }

  try {
    const [result] = await pool.query(
      `UPDATE aset_tetap 
       SET nama_aset = ?, kategori = ?, nilai_aset = ?, 
           tanggal_perolehan = ?, umur_ekonomis = ?, status = ?, akumulasi_depresiasi = ?
       WHERE id = ? AND user_id = ?`,
      [
        nama_aset,
        kategori || 'lainnya',
        nilai_aset,
        tanggal_perolehan,
        umur_ekonomis,
        status || 'aktif',
        akumulasi_depresiasi || 0,
        req.params.id,
        req.user!.id
      ]
    ) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Aset tidak ditemukan' });
      return;
    }

    // Ambil data yang sudah diupdate
    const [rows]: any = await pool.query(
      `SELECT *, (nilai_aset - COALESCE(akumulasi_depresiasi, 0)) AS nilai_buku
       FROM aset_tetap WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      status: 'success',
      data: rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update aset tetap', error: err });
  }
});

// ==========================
// DELETE /api/aset/:id
// ==========================
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM aset_tetap WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.id]
    ) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Aset tidak ditemukan' });
      return;
    }

    res.json({ message: 'Aset tetap berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus aset tetap', error: err });
  }
});

export default router;
