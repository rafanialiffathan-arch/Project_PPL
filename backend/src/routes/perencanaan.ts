import { Router } from 'express';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware as any);

// GET semua perencanaan milik user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM perencanaan WHERE user_id = ? ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data', error: err });
  }
});

// POST tambah perencanaan baru
router.post('/', async (req: AuthRequest, res) => {
  const { nama_plan, target, deadline } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO perencanaan (user_id, nama_plan, target, deadline) VALUES (?, ?, ?, ?)',
      [req.user!.id, nama_plan, target, deadline || null]
    ) as any;
    res.status(201).json({ id: result.insertId, nama_plan, target });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah perencanaan', error: err });
  }
});

export default router;