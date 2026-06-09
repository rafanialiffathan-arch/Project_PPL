import { Request, Response, NextFunction } from 'express';
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

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthUserPayload;

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
