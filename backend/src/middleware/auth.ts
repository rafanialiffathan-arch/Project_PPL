import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request agar bisa nyimpen user dari token
export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN"
  if (!token) {
    res.status(401).json({ message: 'Token tidak ditemukan' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid' });
  }
}