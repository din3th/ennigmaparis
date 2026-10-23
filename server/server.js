import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

// Trust reverse proxies (essential for Vercel Serverless & AWS Lambdas)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false,
}));

// Rate Limiters (active in standalone Node.js, disabled on ephemeral serverless lambdas)
if (!process.env.VERCEL) {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: 'Too many attempts, please try again after 15 minutes.' }
  });

  app.use('/api', apiLimiter);
  app.use('/api/users/login', authLimiter);
  app.use('/api/users/register', authLimiter);
  app.use('/api/payments', authLimiter);
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('vercel.app')
    ) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}));
import { connectDB, dbMiddleware } from './config/db.js';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const uploadsDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Ensure DB is connected before any API route executes (critical for Vercel serverless cold-starts)
app.use('/api', dbMiddleware);

import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import appearanceRoutes from './routes/appearanceRoutes.js';

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appearance', appearanceRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ENNIGMA Paris Backend API Service is live and operational' });
});

// Comprehensive Health & Sync Status Endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || '';
  
  // Sanitize URI to display cluster domain without revealing credentials
  let clusterInfo = 'Not configured';
  if (mongoUri.includes('@')) {
    clusterInfo = mongoUri.split('@')[1].split('/')[0];
  } else if (mongoUri.includes('localhost')) {
    clusterInfo = 'Local MongoDB (localhost)';
  }

  res.status(200).json({
    status: isConnected ? 'healthy' : 'degraded',
    database: {
      connected: isConnected,
      cluster: clusterInfo,
      readyState: mongoose.connection.readyState, // 1 = connected, 0 = disconnected, 2 = connecting
    },
    serverMode: process.env.VERCEL ? 'Vercel Serverless Function' : 'Standalone Express Node.js',
    environment: process.env.NODE_ENV || 'development',
    syncNotice: isConnected 
      ? 'Sync is ACTIVE: Real-time read/write directly to shared MongoDB Atlas cluster.' 
      : 'Sync is INACTIVE: MONGODB_URI missing or connection blocked. Verify Vercel Environment Variables & Atlas 0.0.0.0/0 IP whitelist.',
  });
});

// Database Connection & Server Listener
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Initiate DB connection
connectDB();

export default app;

