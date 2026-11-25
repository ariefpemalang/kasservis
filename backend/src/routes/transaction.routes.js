import express from 'express';
import prisma from '../prisma.js';
import { authenticateToken, canAccessBook } from '../middleware/auth.js';

const router = express.Router();

// GET /api/transactions
// Kasir WiFi: hanya melihat buku WIFI
// Teknisi: hanya melihat buku SERVIS
// Owner: bisa melihat buku apapun (WIFI, SERVIS, PRIBADI, atau SEMUA)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    const { book, type, startDate, endDate, category, search } = req.query;

    const where = {};

    // Penentuan filter buku kas berdasarkan Role
    if (role === 'kasir_wifi') {
      where.book = 'WIFI';
    } else if (role === 'teknisi') {
      where.book = 'SERVIS';
    } else if (role === 'owner') {
      // Owner bisa pilih filter buku, atau jika tidak dipilih bisa melihat semua
      if (book && ['WIFI', 'SERVIS', 'PRIBADI'].includes(book.toUpperCase())) {
        where.book = book.toUpperCase();
      }
    }

    // Filter Type (INCOME / EXPENSE)
    if (type && ['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    // Filter Kategori
    if (category) {
      where.category = category;
    }

    // Filter Pencarian di Catatan
    if (search) {
      where.notes = { contains: search };
    }

    // Filter Rentang Tanggal
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, username: true, role: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Gagal mengambil data transaksi.' });
  }
});

// GET /api/transactions/summary
// Mendapatkan ringkasan saldo, total pemasukan, dan total pengeluaran
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    const { book, startDate, endDate } = req.query;

    const baseWhere = {};
    if (startDate || endDate) {
      baseWhere.date = {};
      if (startDate) baseWhere.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        baseWhere.date.lte = end;
      }
    }

    // Fungsi bantu untuk hitung per buku
    const calculateBookSummary = async (targetBook) => {
      const incomeAgg = await prisma.transaction.aggregate({
        where: { ...baseWhere, book: targetBook, type: 'INCOME' },
        _sum: { amount: true }
      });
      const expenseAgg = await prisma.transaction.aggregate({
        where: { ...baseWhere, book: targetBook, type: 'EXPENSE' },
        _sum: { amount: true }
      });

      const totalIncome = incomeAgg._sum.amount || 0;
      const totalExpense = expenseAgg._sum.amount || 0;
      const balance = totalIncome - totalExpense;

      return { book: targetBook, totalIncome, totalExpense, balance };
    };

    if (role === 'kasir_wifi') {
      const wifiSummary = await calculateBookSummary('WIFI');
      return res.json({ books: { WIFI: wifiSummary } });
    }

    if (role === 'teknisi') {
      const servisSummary = await calculateBookSummary('SERVIS');
      return res.json({ books: { SERVIS: servisSummary } });
    }

    // Untuk Owner: kembalikan ringkasan per buku dan total keseluruhan
    const [wifiSummary, servisSummary, pribadiSummary] = await Promise.all([
      calculateBookSummary('WIFI'),
      calculateBookSummary('SERVIS'),
      calculateBookSummary('PRIBADI')
    ]);

    const totalIncome = wifiSummary.totalIncome + servisSummary.totalIncome + pribadiSummary.totalIncome;
    const totalExpense = wifiSummary.totalExpense + servisSummary.totalExpense + pribadiSummary.totalExpense;
    const totalBalance = totalIncome - totalExpense;

    // Hitung juga Laba Bersih Usaha (WiFi + Servis saja, tanpa pribadi)
    const businessIncome = wifiSummary.totalIncome + servisSummary.totalIncome;
    const businessExpense = wifiSummary.totalExpense + servisSummary.totalExpense;
    const businessBalance = businessIncome - businessExpense;

    res.json({
      books: {
        WIFI: wifiSummary,
        SERVIS: servisSummary,
        PRIBADI: pribadiSummary
      },
      businessTotal: {
        totalIncome: businessIncome,
        totalExpense: businessExpense,
        balance: businessBalance
      },
      grandTotal: {
        totalIncome,
        totalExpense,
        balance: totalBalance
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Gagal menghitung ringkasan kas.' });
  }
});

// POST /api/transactions
// Tambah catatan pemasukan / pengeluaran baru
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let { book, type, amount, category, notes, date, receiptUrl } = req.body;

    if (!book || !type || !amount || !category) {
      return res.status(400).json({ message: 'Buku kas, tipe (INCOME/EXPENSE), nominal, dan kategori wajib diisi.' });
    }

    book = book.toUpperCase();
    type = type.toUpperCase();

    if (!['WIFI', 'SERVIS', 'PRIBADI'].includes(book)) {
      return res.status(400).json({ message: 'Buku kas tidak valid.' });
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({ message: 'Tipe transaksi harus INCOME atau EXPENSE.' });
    }

    // Validasi Akses Buku Kas
    if (!canAccessBook(role, book)) {
      return res.status(403).json({ message: `Akun Anda tidak memiliki izin untuk mencatat pada Buku Kas ${book}.` });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Nominal harus berupa angka positif.' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        book,
        type,
        amount: parsedAmount,
        category: category.trim(),
        notes: notes ? notes.trim() : null,
        date: date ? new Date(date) : new Date(),
        receiptUrl: receiptUrl || null,
        userId
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, role: true }
        }
      }
    });

    // Broadcast realtime via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('transaction:created', transaction);
    }

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Gagal menyimpan transaksi.' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    const transactionId = parseInt(req.params.id);
    const { amount, category, notes, date, receiptUrl } = req.body;

    const existing = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    if (!canAccessBook(role, existing.book)) {
      return res.status(403).json({ message: 'Anda tidak memiliki hak akses mengubah transaksi ini.' });
    }

    const updateData = {};
    if (amount) {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({ message: 'Nominal tidak valid.' });
      }
      updateData.amount = parsed;
    }
    if (category) updateData.category = category.trim();
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;
    if (date) updateData.date = new Date(date);
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, username: true, role: true }
        }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('transaction:updated', updated);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui transaksi.' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    const transactionId = parseInt(req.params.id);

    const existing = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    if (!canAccessBook(role, existing.book)) {
      return res.status(403).json({ message: 'Anda tidak memiliki hak akses menghapus transaksi ini.' });
    }

    await prisma.transaction.delete({
      where: { id: transactionId }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('transaction:deleted', { id: transactionId, book: existing.book });
    }

    res.json({ message: 'Transaksi berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus transaksi.' });
  }
});

export default router;
