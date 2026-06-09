import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

router.use(authMiddleware as any);
router.use(requireRole('admin_sistem') as any);

const ROLE_WHITELIST = ['admin_sistem', 'pimpinan', 'pengelola_internal'] as const;

const PERMISSION_WHITELIST = [
  'view_dashboard',
  'view_reports',
  'view_pembukuan',
  'manage_transaksi',
  'manage_aset',
  'manage_inventaris',
  'manage_rekonsiliasi',
  'manage_perencanaan',
  'approve_transaction',
] as const;

const SAFE_USER_FIELDS =
  'id, nama_lengkap, email, username, role, permissions, is_active, created_by, created_at, updated_at';

const stripPassword = (user: any) => {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generateRandomPassword = (length = 12): string => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*';
  const all = upper + lower + digits + symbols;
  const required: string[] = [
    upper[Math.floor(Math.random() * upper.length)]!,
    lower[Math.floor(Math.random() * lower.length)]!,
    digits[Math.floor(Math.random() * digits.length)]!,
    symbols[Math.floor(Math.random() * symbols.length)]!,
  ];
  const remaining: string[] = [];
  for (let i = 0; i < length - required.length; i++) {
    remaining.push(all[Math.floor(Math.random() * all.length)]!);
  }
  const chars = [...required, ...remaining];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ci = chars[i]!;
    const cj = chars[j]!;
    chars[i] = cj;
    chars[j] = ci;
  }
  return chars.join('');
};

const countAdmins = async (): Promise<number> => {
  const [rows]: any = await pool.query(
    'SELECT COUNT(*) AS total FROM users WHERE role = ? AND is_active = 1',
    ['admin_sistem']
  );
  return Number(rows[0]?.total || 0);
};

// ==========================
// GET /api/admin/users
// ==========================
router.get('/users', async (_req, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT ${SAFE_USER_FIELDS} FROM users ORDER BY id ASC`
    );
    return res.json(rows.map(stripPassword));
  } catch (err) {
    console.error('Admin GET users error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================
// GET /api/admin/users/:id
// ==========================
router.get('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'ID user tidak valid' });
  }

  try {
    const [rows]: any = await pool.query(
      `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.json(stripPassword(rows[0]));
  } catch (err) {
    console.error('Admin GET user error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================
// POST /api/admin/users
// ==========================
router.post('/users', async (req: AuthRequest, res) => {
  const { nama_lengkap, email, username, role } = req.body || {};
  let { password } = req.body || {};
  let permissions: string[] | null | undefined = req.body?.permissions;

  if (!nama_lengkap || !email || !username || !role) {
    return res.status(400).json({
      message: 'Field wajib: nama_lengkap, email, username, role',
    });
  }

  if (typeof nama_lengkap !== 'string' || nama_lengkap.trim().length === 0) {
    return res.status(400).json({ message: 'nama_lengkap tidak valid' });
  }

  if (typeof email !== 'string' || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Format email tidak valid' });
  }

  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ message: 'Username minimal 3 karakter' });
  }

  if (!ROLE_WHITELIST.includes(role)) {
    return res.status(400).json({
      message: 'Role tidak valid. Harus salah satu dari: ' + ROLE_WHITELIST.join(', '),
    });
  }

  if (password !== undefined) {
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password minimal 8 karakter' });
    }
  }

  if (permissions !== undefined && permissions !== null) {
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'permissions harus berupa array atau null' });
    }
    for (const p of permissions) {
      if (typeof p !== 'string' || !(PERMISSION_WHITELIST as readonly string[]).includes(p)) {
        return res.status(400).json({
          message: `Permission tidak dikenal: ${p}`,
        });
      }
    }
  } else if (permissions === undefined) {
    permissions = null;
  }

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
      return res.status(409).json({ message: 'Email dan username sudah digunakan' });
    }
    if (emailExists.length > 0) {
      return res.status(409).json({ message: 'Email sudah digunakan' });
    }
    if (usernameExists.length > 0) {
      return res.status(409).json({ message: 'Username sudah digunakan' });
    }

    let generatedPassword: string | null = null;
    if (!password) {
      password = generateRandomPassword(12);
      generatedPassword = password;
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (nama_lengkap, email, username, password, role, permissions, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        nama_lengkap.trim(),
        email.trim().toLowerCase(),
        username.trim(),
        hashed,
        role,
        permissions === null ? null : JSON.stringify(permissions),
        req.user?.id || null,
      ]
    );

    const [created]: any = await pool.query(
      `SELECT ${SAFE_USER_FIELDS} FROM users WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    const responseBody: any = {
      message: 'User berhasil dibuat',
      user: stripPassword(created[0]),
    };
    if (generatedPassword) {
      responseBody.temporary_password = generatedPassword;
    }

    return res.status(201).json(responseBody);
  } catch (err) {
    console.error('Admin POST user error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================
// PATCH /api/admin/users/:id
// ==========================
router.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'ID user tidak valid' });
  }

  const { nama_lengkap, email, username } = req.body || {};
  const updates: string[] = [];
  const values: any[] = [];

  if (nama_lengkap !== undefined) {
    if (typeof nama_lengkap !== 'string' || nama_lengkap.trim().length === 0) {
      return res.status(400).json({ message: 'nama_lengkap tidak valid' });
    }
    updates.push('nama_lengkap = ?');
    values.push(nama_lengkap.trim());
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }
    updates.push('email = ?');
    values.push(email.trim().toLowerCase());
  }

  if (username !== undefined) {
    if (typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ message: 'Username minimal 3 karakter' });
    }
    updates.push('username = ?');
    values.push(username.trim());
  }

  if (updates.length === 0) {
    return res.status(400).json({
      message: 'Tidak ada field yang dikirim. Hanya nama_lengkap, email, username yang dapat diubah di endpoint ini.',
    });
  }

  try {
    const [exists]: any = await pool.query(
      `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ?`,
      [id]
    );
    if (exists.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (email !== undefined) {
      const [emailExists]: any = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id <> ?',
        [email.trim().toLowerCase(), id]
      );
      if (emailExists.length > 0) {
        return res.status(409).json({ message: 'Email sudah digunakan user lain' });
      }
    }

    if (username !== undefined) {
      const [usernameExists]: any = await pool.query(
        'SELECT id FROM users WHERE username = ? AND id <> ?',
        [username.trim(), id]
      );
      if (usernameExists.length > 0) {
        return res.status(409).json({ message: 'Username sudah digunakan user lain' });
      }
    }

    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, [...values, id]);

    const [updated]: any = await pool.query(
      `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ?`,
      [id]
    );
    return res.json({
      message: 'User berhasil diperbarui',
      user: stripPassword(updated[0]),
    });
  } catch (err) {
    console.error('Admin PATCH user error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================
// PATCH /api/admin/users/:id/role
// ==========================
router.patch('/users/:id/role', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'ID user tidak valid' });
  }

  const { role } = req.body || {};
  if (!role || !ROLE_WHITELIST.includes(role)) {
    return res.status(400).json({
      message: 'Role tidak valid. Harus salah satu dari: ' + ROLE_WHITELIST.join(', '),
    });
  }

  try {
    const [exists]: any = await pool.query(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      [id]
    );
    if (exists.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const target = exists[0];

    if (target.role === 'admin_sistem' && role !== 'admin_sistem') {
      const adminCount = await countAdmins();
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Tidak dapat mengubah role admin terakhir. Minimal 1 admin_sistem aktif harus ada.',
        });
      }
    }

    await pool.query(
      'UPDATE users SET role = ?, permissions = NULL WHERE id = ?',
      [role, id]
    );

    const [updated]: any = await pool.query(
      `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ?`,
      [id]
    );

    return res.json({
      message: 'Role user berhasil diperbarui. permissions telah di-reset ke default role.',
      user: stripPassword(updated[0]),
    });
  } catch (err) {
    console.error('Admin PATCH role error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================
// PATCH /api/admin/users/:id/permissions
// ==========================
router.patch('/users/:id/permissions', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'ID user tidak valid' });
  }

  const { permissions } = req.body || {};

  if (permissions === null) {
    // valid: reset to default role_permissions
  } else if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: 'permissions harus berupa array atau null' });
  } else {
    for (const p of permissions) {
      if (typeof p !== 'string' || !(PERMISSION_WHITELIST as readonly string[]).includes(p)) {
        return res.status(400).json({
          message: `Permission tidak dikenal: ${p}`,
        });
      }
    }
  }

  try {
    const [exists]: any = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (exists.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const valueToStore = permissions === null ? null : JSON.stringify(permissions);
    await pool.query('UPDATE users SET permissions = ? WHERE id = ?', [valueToStore, id]);

    const [updated]: any = await pool.query(
      `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ?`,
      [id]
    );

    return res.json({
      message: 'Permissions user berhasil diperbarui',
      user: stripPassword(updated[0]),
    });
  } catch (err) {
    console.error('Admin PATCH permissions error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================
// PATCH /api/admin/users/:id/status
// ==========================
router.patch('/users/:id/status', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'ID user tidak valid' });
  }

  const { is_active } = req.body || {};
  if (is_active !== 0 && is_active !== 1) {
    return res.status(400).json({ message: 'is_active harus 0 atau 1' });
  }

  if (id === Number(req.user?.id) && is_active === 0) {
    return res.status(400).json({ message: 'Admin tidak dapat menonaktifkan dirinya sendiri' });
  }

  try {
    const [exists]: any = await pool.query(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      [id]
    );
    if (exists.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (exists[0].role === 'admin_sistem' && is_active === 0) {
      const adminCount = await countAdmins();
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Tidak dapat menonaktifkan admin_sistem terakhir. Minimal 1 admin_sistem aktif harus ada.',
        });
      }
    }

    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);

    const [updated]: any = await pool.query(
      `SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = ?`,
      [id]
    );

    return res.json({
      message: is_active === 1 ? 'User diaktifkan' : 'User dinonaktifkan',
      user: stripPassword(updated[0]),
    });
  } catch (err) {
    console.error('Admin PATCH status error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================
// PATCH /api/admin/users/:id/reset-password
// ==========================
router.patch('/users/:id/reset-password', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'ID user tidak valid' });
  }

  const { new_password } = req.body || {};
  if (new_password !== undefined && (typeof new_password !== 'string' || new_password.length < 8)) {
    return res.status(400).json({ message: 'new_password minimal 8 karakter' });
  }

  try {
    const [exists]: any = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (exists.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const finalPassword = new_password || generateRandomPassword(12);
    const hashed = await bcrypt.hash(finalPassword, 10);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);

    return res.json({
      message: 'Password berhasil direset',
      new_password: finalPassword,
    });
  } catch (err) {
    console.error('Admin reset-password error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;
