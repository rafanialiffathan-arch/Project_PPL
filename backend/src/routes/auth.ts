import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const toAuthUser = (user: any) => ({
  id: user.id,
  nama: user.nama_lengkap,
  nama_lengkap: user.nama_lengkap,
  username: user.username,
  email: user.email,
  role: user.role
});

const publicRegisterEnabled = () => process.env.ALLOW_PUBLIC_REGISTER === 'true';

// ==========================
// REGISTER (PUBLIC - DISABLED FOR PRODUCTION)
// ==========================
// Akun baru hanya dapat dibuat oleh Admin Sistem melalui Admin Panel.
// Endpoint ini dinonaktifkan untuk publik demi keamanan produksi.
// Untuk sementara endpoint tetap ada agar tidak mengganggu kompatibilitas,
// namun akan selalu menolak request publik kecuali ALLOW_PUBLIC_REGISTER=true.
router.post('/register', async (req, res) => {
  if (!publicRegisterEnabled()) {
    return res.status(403).json({
      message:
        'Registrasi publik dinonaktifkan. Akun hanya dapat dibuat oleh Admin Sistem.',
    });
  }

  const { nama_lengkap, email, username, password, role } = req.body;

  // Validasi basic
  if (!nama_lengkap || !email || !username || !password) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  // Untuk alur publik, role TIDAK boleh dipilih sembarangan.
  // Default role untuk register publik yang diizinkan: 'pengelola_internal'.
  const allowedRole = 'pengelola_internal';
  if (role && role !== allowedRole) {
    return res.status(400).json({
      message: 'Peran tidak valid untuk registrasi publik.',
    });
  }

  try {
    // Cek email separately
    const [emailExists]: any = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    // Cek username separately
    const [usernameExists]: any = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (emailExists.length > 0 && usernameExists.length > 0) {
      return res.status(409).json({
        message: 'Email dan username sudah digunakan.',
      });
    } else if (emailExists.length > 0) {
      return res.status(409).json({
        message: 'Email sudah pernah didaftarkan/digunakan.',
      });
    } else if (usernameExists.length > 0) {
      return res.status(409).json({
        message: 'Username sudah terdaftar. Silakan gunakan username lain.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (nama_lengkap, email, username, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [nama_lengkap, email, username, hashedPassword, allowedRole]
    );

    return res.status(201).json({
      message: 'Registrasi berhasil! Silakan login.',
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
    });
  }
});

// ==========================
// LOGIN
// ==========================
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      message: 'Username/email dan password wajib diisi',
    });
  }

  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Username atau email belum terdaftar.',
      });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        message: 'Username/email atau password salah.',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login berhasil!',
      token,
      user: toAuthUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
    });
  }
});

// ==========================
// CURRENT USER
// ==========================
router.get('/me', authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, nama_lengkap, email, username, role FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.json(toAuthUser(rows[0]));
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
    });
  }
});

export default router;
