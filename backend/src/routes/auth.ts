import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

const router = Router();

// ==========================
// REGISTER
// ==========================
router.post('/register', async (req, res) => {
  const { nama_lengkap, email, username, password, role } = req.body;

  // Validasi basic
  if (!nama_lengkap || !email || !username || !password) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  try {
    // Cek email / username sudah ada
    const [existing]: any = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Email atau username sudah digunakan'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query(
      `INSERT INTO users (nama_lengkap, email, username, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [nama_lengkap, email, username, hashedPassword, role || 'admin']
    );

    return res.status(201).json({
      message: 'Registrasi berhasil! Silakan login.'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Server error',
      error: err
    });
  }
});

// ==========================
// LOGIN
// ==========================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validasi
  if (!email || !password) {
    return res.status(400).json({
      message: 'Email dan password wajib diisi'
    });
  }

  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Email atau password salah'
      });
    }

    const user = rows[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        message: 'Email atau password salah'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        nama: user.nama_lengkap,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Server error',
      error: err
    });
  }
});

export default router;