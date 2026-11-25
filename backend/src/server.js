import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import uploadRoutes from './routes/upload.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Inisialisasi Socket.io untuk Realtime Sync
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Simpan instance io agar bisa dipanggil dari routes controller
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads folder (Foto nota / struk)
const uploadPath = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Buku Kas API is running realtime', timestamp: new Date() });
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log('Client connected to realtime socket:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve frontend dist jika sudah di-build (Single port deploy untuk aaPanel PM2)
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 BUKU KAS SERVER RUNNING ON http://0.0.0.0:${PORT}`);
  console.log(`📡 Realtime Socket.io ready!`);
  console.log(`📁 Frontend Dist served: ${fs.existsSync(frontendDist) ? 'YES' : 'NO'}`);
  console.log(`====================================================`);
});
