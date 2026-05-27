import { Router } from 'express';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Semua route wajib login
router.use(authMiddleware as any);

// ==========================
// GET /api/inventaris — ambil semua inventaris user
// ==========================
router.get('/', async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM inventaris
       WHERE user_id = ?
       ORDER BY tanggal_masuk DESC, created_at DESC`,
      [req.user!.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data inventaris', error: err });
  }
});

// ==========================
// GET /api/inventaris/:id — ambil 1 inventaris by ID
// ==========================
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM inventaris
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user!.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: 'Inventaris tidak ditemukan' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data inventaris', error: err });
  }
});

// ==========================
// POST /api/inventaris — tambah inventaris baru
// ==========================
router.post('/', async (req: AuthRequest, res) => {
  const {
    nama_barang,
    kategori,
    jumlah,
    satuan,
    harga_satuan,
    tanggal_masuk,
    kondisi,
    status
  } = req.body;

  // Validasi wajib
  if (!nama_barang || !jumlah || !harga_satuan) {
    res.status(400).json({
      message: 'Field wajib: nama_barang, jumlah, harga_satuan'
    });
    return;
  }

  try {
    // Hitung total_nilai
    const total_nilai = Number(jumlah) * Number(harga_satuan);

    const [result] = await pool.query(
      `INSERT INTO inventaris
         (user_id, nama_barang, kategori, jumlah, satuan, harga_satuan, total_nilai, tanggal_masuk, kondisi, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user!.id,
        nama_barang,
        kategori || 'lainnya',
        jumlah,
        satuan || 'unit',
        harga_satuan,
        total_nilai,
        tanggal_masuk || new Date().toISOString().split('T')[0],
        kondisi || 'baik',
        status || 'tersedia'
      ]
    ) as any;

    // Ambil data yang baru dibuat
    const [rows]: any = await pool.query(
      `SELECT * FROM inventaris WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      status: 'success',
      data: rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah inventaris', error: err });
  }
});

// ==========================
// PUT /api/inventaris/:id — update inventaris
// ==========================
router.put('/:id', async (req: AuthRequest, res) => {
  const {
    nama_barang,
    kategori,
    jumlah,
    satuan,
    harga_satuan,
    tanggal_masuk,
    kondisi,
    status
  } = req.body;

  // Validasi wajib
  if (!nama_barang || !jumlah || !harga_satuan) {
    res.status(400).json({
      message: 'Field wajib: nama_barang, jumlah, harga_satuan'
    });
    return;
  }

  try {
    // Hitung total_nilai
    const total_nilai = Number(jumlah) * Number(harga_satuan);

    const [result] = await pool.query(
      `UPDATE inventaris 
       SET nama_barang = ?, kategori = ?, jumlah = ?, satuan = ?, 
           harga_satuan = ?, total_nilai = ?, tanggal_masuk = ?, kondisi = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [
        nama_barang,
        kategori || 'lainnya',
        jumlah,
        satuan || 'unit',
        harga_satuan,
        total_nilai,
        tanggal_masuk || new Date().toISOString().split('T')[0],
        kondisi || 'baik',
        status || 'tersedia',
        req.params.id,
        req.user!.id
      ]
    ) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Inventaris tidak ditemukan' });
      return;
    }

    // Ambil data yang sudah diupdate
    const [rows]: any = await pool.query(
      `SELECT * FROM inventaris WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      status: 'success',
      data: rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update inventaris', error: err });
  }
});

// ==========================
// DELETE /api/inventaris/:id
// ==========================
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM inventaris WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.id]
    ) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Inventaris tidak ditemukan' });
      return;
    }

    res.json({ message: 'Inventaris berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus inventaris', error: err });
  }
});

export default router;
