import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bukukas_super_secret_jwt_key_2026_wifi_servis');
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, name: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Sesi kedaluwarsa atau token tidak valid.' });
  }
};

// Middleware pembatasan role
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak terotentikasi.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak memiliki hak akses untuk fitur ini.' });
    }
    next();
  };
};

// Validasi akses ke Buku Kas tertentu
export const canAccessBook = (userRole, book) => {
  if (userRole === 'owner') return true;
  if (userRole === 'kasir_wifi' && book === 'WIFI') return true;
  if (userRole === 'teknisi' && book === 'SERVIS') return true;
  return false;
};
