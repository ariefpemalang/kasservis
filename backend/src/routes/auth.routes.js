import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'bukukas_super_secret_jwt_key_2026_wifi_servis',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat login.' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// --- USER MANAGEMENT (HANYA OWNER / SUPERADMIN) ---

// Get all users
router.get('/users', authenticateToken, requireRole(['owner']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data user.' });
  }
});

// Create new user (Owner can create kasir_wifi, teknisi, or another owner)
router.post('/users', authenticateToken, requireRole(['owner']), async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    if (!['owner', 'kasir_wifi', 'teknisi'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid.' });
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    if (existing) {
      return res.status(400).json({ message: 'Username sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        name,
        role
      },
      select: { id: true, username: true, name: true, role: true, createdAt: true }
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat user baru.' });
  }
});

// Update user password or details
router.put('/users/:id', authenticateToken, requireRole(['owner']), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, role, password } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (role && ['owner', 'kasir_wifi', 'teknisi'].includes(role)) updateData.role = role;
    if (password && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, name: true, role: true }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui user.' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireRole(['owner']), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Jangan hapus diri sendiri jika satu-satunya owner
    if (req.user.id === userId) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun Anda sendiri saat sedang login.' });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus user.' });
  }
});

export default router;
