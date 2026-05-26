import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db';

import transaksiRoutes from './routes/transaksi';
import authRoutes from './routes/auth';
import perencanaanRoutes from './routes/perencanaan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// ==========================
// ROUTES
// ==========================
app.use('/api/auth', authRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/perencanaan', perencanaanRoutes);

// ==========================
// ROOT ENDPOINT
// ==========================
app.get('/', (req, res) => {
  res.json({
    message: 'AccounTech API running 🚀',
    status: 'OK'
  });
});

// ==========================
// ERROR HANDLER (GLOBAL)
// ==========================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🔥 ERROR:', err);

  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================
// START SERVER
// ==========================
const startServer = async () => {
  try {
    await testConnection(); // pastikan DB connect dulu

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Gagal connect ke database:', error);
    process.exit(1);
  }
};

startServer();