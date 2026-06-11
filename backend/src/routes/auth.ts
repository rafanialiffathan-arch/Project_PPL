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
  role: user.role,
  permissions: parsePermissions(user.permissions)
});

const publicRegisterEnabled = () => process.env.ALLOW_PUBLIC_REGISTER === 'true';

const ADMIN_PERMISSIONS = [
  'view_dashboard',
  'view_reports',
  'view_pembukuan',
  'manage_transaksi',
  'manage_aset',
  'manage_inventaris',
  'manage_rekonsiliasi',
  'manage_perencanaan',
  'approve_transaction',
  'manage_users'
];

const PIMPINAN_PERMISSIONS = [
  'view_dashboard',
  'view_reports',
  'view_pembukuan',
  'approve_transaction'
];

const PENGELOLA_PERMISSIONS = [
  'view_dashboard',
  'view_reports',
  'view_pembukuan',
  'manage_transaksi',
  'manage_aset',
  'manage_inventaris',
  'manage_rekonsiliasi',
  'manage_perencanaan'
];

function parsePermissions(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function defaultPermissionsForRole(role: string): string[] {
  switch (role) {
    case 'admin':
    case 'admin_sistem':
      return [...ADMIN_PERMISSIONS];
    case 'pimpinan':
      return [...PIMPINAN_PERMISSIONS];
    case 'pengelola':
    case 'pengelola_internal':
      return [...PENGELOLA_PERMISSIONS];
    default:
      return [];
  }
}

function buildUserResponse(user: any) {
  const storedPerms = parsePermissions(user.permissions);
  const effectivePerms = storedPerms.length > 0
    ? storedPerms
    : defaultPermissionsForRole(user.role);

  return {
    id: user.id,
    nama: user.nama_lengkap,
    nama_lengkap: user.nama_lengkap,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: effectivePerms
  };
}

function signToken(user: any, permissions: string[]) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
}

// ==========================
// REGISTER (PUBLIC - DISABLED FOR PRODUCTION)
// ==========================
router.post('/register', async (req, res) => {
  if (!publicRegisterEnabled()) {
    return res.status(403).json({
      message:
        'Registrasi publik dinonaktifkan. Akun hanya dapat dibuat oleh Admin Sistem.',
    });
  }

  const { nama_lengkap, email, username, password } = req.body;

  if (!nama_lengkap || !email || !username || !password) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  const allowedRole = 'pengelola_internal';

  try {
    const [emailExists]: any = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    const [usernameExists]: any = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (emailExists.length > 0 && usernameExists.length > 0) {
      return res.status(409).json({ message: 'Email dan username sudah digunakan.' });
    } else if (emailExists.length > 0) {
      return res.status(409).json({ message: 'Email sudah pernah didaftarkan.' });
    } else if (usernameExists.length > 0) {
      return res.status(409).json({ message: 'Username sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultPerms = defaultPermissionsForRole(allowedRole);

    await pool.query(
      `INSERT INTO users (nama_lengkap, email, username, password, role, permissions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nama_lengkap, email, username, hashedPassword, allowedRole, JSON.stringify(defaultPerms)]
    );

    return res.status(201).json({
      message: 'Registrasi berhasil! Silakan login.',
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================
// LOGIN
// ==========================
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Username/email dan password wajib diisi' });
  }

  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Username atau email belum terdaftar.' });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Username/email atau password salah.' });
    }

    const userResponse = buildUserResponse(user);
    const token = signToken(user, userResponse.permissions);

    return res.json({
      message: 'Login berhasil!',
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================
// CURRENT USER
// ==========================
router.get('/me', authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, nama_lengkap, email, username, role, permissions FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.json(buildUserResponse(rows[0]));
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================
// CURRENT USER PERMISSIONS
// ==========================
router.get('/permissions', authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT role, permissions FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const user = rows[0];
    const stored = parsePermissions(user.permissions);
    const effective = stored.length > 0 ? stored : defaultPermissionsForRole(user.role);

    return res.json({
      role: user.role,
      permissions: effective,
      is_stored: stored.length > 0
    });
  } catch (err) {
    console.error('Permissions error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;
