import { Router } from 'express';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Semua endpoint pakai auth middleware
router.use(authMiddleware as any);

// ==========================
// GET /api/rekonsiliasi - Ambil semua rekonsiliasi
// ==========================
router.get('/', async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nama_bank, nomor_rekening, saldo_buku, saldo_bank, 
              (saldo_bank - saldo_buku) as selisih, 
              tanggal_rekonsiliasi, status, catatan, created_at, updated_at 
       FROM rekonsiliasi_bank 
       WHERE user_id = ? 
       ORDER BY tanggal_rekonsiliasi DESC, created_at DESC`,
      [req.user!.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Gagal fetch rekonsiliasi:', err);
    res.status(500).json({ message: 'Gagal mengambil data rekonsiliasi', error: err });
  }
});

// ==========================
// GET /api/rekonsiliasi/:id - Ambil satu rekonsiliasi
// ==========================
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, nama_bank, nomor_rekening, saldo_buku, saldo_bank, 
              (saldo_bank - saldo_buku) as selisih, 
              tanggal_rekonsiliasi, status, catatan, created_at, updated_at 
       FROM rekonsiliasi_bank 
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user!.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data rekonsiliasi tidak ditemukan' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Gagal fetch rekonsiliasi:', err);
    res.status(500).json({ message: 'Gagal mengambil data rekonsiliasi', error: err });
  }
});

// ==========================
// POST /api/rekonsiliasi - Tambah rekonsiliasi baru
// ==========================
router.post('/', async (req: AuthRequest, res) => {
  const { nama_bank, nomor_rekening, saldo_buku, saldo_bank, tanggal_rekonsiliasi, status, catatan } = req.body;

  // Validasi required fields
  if (!nama_bank || !nomor_rekening || saldo_buku === undefined || saldo_bank === undefined || !tanggal_rekonsiliasi) {
    return res.status(400).json({ message: 'Field wajib: nama_bank, nomor_rekening, saldo_buku, saldo_bank, tanggal_rekonsiliasi' });
  }

  try {
    // Hitung selisih
    const selisih = Number(saldo_bank) - Number(saldo_buku);

    // Auto-set status berdasarkan selisih jika tidak dispecified
    let finalStatus = status || 'pending';
    if (finalStatus === 'pending' && selisih === 0) {
      finalStatus = 'sesuai';
    } else if (finalStatus === 'pending' && selisih !== 0) {
      finalStatus = 'selisih';
    }

    const [result]: any = await pool.query(
      `INSERT INTO rekonsiliasi_bank (user_id, nama_bank, nomor_rekening, saldo_buku, saldo_bank, tanggal_rekonsiliasi, status, catatan) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user!.id, nama_bank, nomor_rekening, saldo_buku, saldo_bank, tanggal_rekonsiliasi, finalStatus, catatan || null]
    );

    res.status(201).json({
      message: 'Rekonsiliasi berhasil ditambahkan',
      id: result.insertId,
      selisih,
      status: finalStatus
    });
  } catch (err) {
    console.error('Gagal tambah rekonsiliasi:', err);
    res.status(500).json({ message: 'Gagal menambah data rekonsiliasi', error: err });
  }
});

// ==========================
// PUT /api/rekonsiliasi/:id - Update rekonsiliasi
// ==========================
router.put('/:id', async (req: AuthRequest, res) => {
  const { nama_bank, nomor_rekening, saldo_buku, saldo_bank, tanggal_rekonsiliasi, status, catatan } = req.body;

  // Cek ownership
  const [existing]: any = await pool.query(
    'SELECT id FROM rekonsiliasi_bank WHERE id = ? AND user_id = ?',
    [req.params.id, req.user!.id]
  );

  if (existing.length === 0) {
    return res.status(404).json({ message: 'Data rekonsiliasi tidak ditemukan' });
  }

  try {
    // Hitung selisih
    const selisih = Number(saldo_bank) - Number(saldo_buku);

    // Auto-set status berdasarkan selisih jika status = pending
    let finalStatus = status;
    if (status === 'pending' || !status) {
      finalStatus = selisih === 0 ? 'sesuai' : 'selisih';
    }

    await pool.query(
      `UPDATE rekonsiliasi_bank 
       SET nama_bank = ?, nomor_rekening = ?, saldo_buku = ?, saldo_bank = ?, 
           tanggal_rekonsiliasi = ?, status = ?, catatan = ?
       WHERE id = ? AND user_id = ?`,
      [nama_bank, nomor_rekening, saldo_buku, saldo_bank, tanggal_rekonsiliasi, finalStatus, catatan || null, req.params.id, req.user!.id]
    );

    res.json({
      message: 'Rekonsiliasi berhasil diupdate',
      selisih,
      status: finalStatus
    });
  } catch (err) {
    console.error('Gagal update rekonsiliasi:', err);
    res.status(500).json({ message: 'Gagal mengupdate data rekonsiliasi', error: err });
  }
});

// ==========================
// DELETE /api/rekonsiliasi/:id - Hapus rekonsiliasi
// ==========================
router.delete('/:id', async (req: AuthRequest, res) => {
  // Cek ownership
  const [existing]: any = await pool.query(
    'SELECT id, nama_bank FROM rekonsiliasi_bank WHERE id = ? AND user_id = ?',
    [req.params.id, req.user!.id]
  );

  if (existing.length === 0) {
    return res.status(404).json({ message: 'Data rekonsiliasi tidak ditemukan' });
  }

  try {
    await pool.query(
      'DELETE FROM rekonsiliasi_bank WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.id]
    );

    res.json({ message: `Rekonsiliasi bank "${existing[0].nama_bank}" berhasil dihapus` });
  } catch (err) {
    console.error('Gagal hapus rekonsiliasi:', err);
    res.status(500).json({ message: 'Gagal menghapus data rekonsiliasi', error: err });
  }
});

export default router;