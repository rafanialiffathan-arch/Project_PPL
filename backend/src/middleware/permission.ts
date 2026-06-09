import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type Permission =
  | 'input_pemasukan'
  | 'input_pengeluaran'
  | 'manage_assets'
  | 'manage_inventory'
  | 'manage_reconciliation'
  | 'view_reports'
  | 'manage_users';

const ADMIN_ROLE = 'admin_sistem';
const PIMPINAN_ROLE = 'pimpinan';

// Admin selalu punya semua permission
function hasPermission(user: AuthRequest['user'], permission: Permission): boolean {
  if (!user) return false;
  if (user.role === ADMIN_ROLE) return true;

  if (user.role === PIMPINAN_ROLE) {
    return permission === 'view_reports';
  }

  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }

  return false;
}

export function requirePermission(...permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak terautentikasi' });
    }

    const allowed = permissions.every((p) => hasPermission(req.user, p));
    if (!allowed) {
      return res.status(403).json({
        message: 'Anda tidak memiliki akses untuk tindakan ini',
      });
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak terautentikasi' });
    }

    if (!roles.includes(req.user.role || '')) {
      return res.status(403).json({
        message: 'Akses ditolak untuk peran ini',
      });
    }

    next();
  };
}
