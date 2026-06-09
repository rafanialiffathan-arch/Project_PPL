import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

export type AuthUserPayload = {
  id: number;
  username: string;
  role: string;
  permissions?: string[];
  nama_lengkap?: string;
};

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ JWT_SECRET tidak ditemukan. Set di environment / .env');
    process.exit(1);
  }
  return secret;
})();

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'Token tidak ditemukan. Harap login terlebih dahulu.' });
    }

    const token = authHeader.split(' ')[1] ?? '';
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthUserPayload;

    if (process.env.NODE_ENV === 'production') {
      try {
        const [rows]: any = await pool.query(
          'SELECT role, nama_lengkap FROM users WHERE id = ?',
          [decoded.id]
        );

        if (rows.length === 0) {
          return res
            .status(401)
            .json({ message: 'User tidak ditemukan atau sudah dihapus' });
        }

        decoded.role = rows[0].role;
        decoded.nama_lengkap = rows[0].nama_lengkap;
      } catch (dbErr) {
        console.error('Auth DB check error:', dbErr);
        // Lanjutkan dengan data token jika DB tidak bisa diakses,
        // agar tidak menggangu user yang valid.
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res
      .status(401)
      .json({ message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};

// ==========================
// Role guard
// ==========================
// Menerima satu atau beberapa role. Memerlukan authMiddleware berjalan
// sebelumnya agar `req.user` terisi.
export const requireRole = (...roles: string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ message: 'Akses ditolak: tidak terautentikasi' });
    }
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: 'Akses ditolak: peran tidak memiliki izin',
      });
    }
    next();
  };
};

// ==========================
// Permission guard
// ==========================
// Menerima satu atau beberapa permission. Memerlukan authMiddleware berjalan
// sebelumnya. Permissions dibaca dari `req.user.permissions` (array).
export const requirePermission = (...required: string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userPerms = req.user?.permissions;
    if (!userPerms) {
      return res.status(403).json({
        message: 'Akses ditolak: tidak ada permissions',
      });
    }
    const has = required.every((p) => userPerms.includes(p));
    if (!has) {
      return res.status(403).json({
        message: 'Akses ditolak: permission tidak cukup',
      });
    }
    next();
  };
};
