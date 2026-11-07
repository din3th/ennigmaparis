import { assertRequiredEnv, config } from './config/env.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import Media from './models/Media.js';
import { connectDB, dbMiddleware } from './config/db.js';
import { parseCookies, csrfGuard } from './middleware/authMiddleware.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import logger from './utils/logger.js';

import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import appearanceRoutes from './routes/appearanceRoutes.js';

// Fail fast on missing secrets instead of silently using insecure defaults.
assertRequiredEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust the first reverse proxy (Vercel / Docker ingress) so req.ip is the client.
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false,
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy: Origin not allowed'), false);
  },
  credentials: true,
}));

// Keep the raw body for webhook signature verification (Stripe signs raw bytes).
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(parseCookies);

// Uploaded files: lock them down so a malicious file (e.g. an old SVG) cannot run script.
const lockDownUpload = (res) => {
  res.set({
    'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
};

const uploadsDir = config.isServerless ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {
  logger.warn('Could not create uploads directory', { err: e });
}
app.use('/uploads', express.static(uploadsDir, { setHeaders: lockDownUpload, maxAge: '30d' }));

// Fallback: files persisted to MongoDB (used when Cloudinary is not configured on serverless).
app.get(/^\/uploads\/(.+)$/, dbMiddleware, async (req, res) => {
  const filename = path.basename(req.params[0] || req.path);
  const media = await Media.findOne({ filename });
  if (!media) {
    return res.status(404).json({ message: 'File not found' });
  }
  lockDownUpload(res);
  res.set({
    'Content-Type': media.contentType || 'application/octet-stream',
    'Content-Length': media.size || media.data.length,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(media.contentType || '')) {
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
  }
  return res.end(media.data);
});

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'healthy' : 'degraded',
    database: { connected },
    environment: process.env.NODE_ENV || 'development',
  });
});

const csrfExempt = ['/api/payments/webhook', '/api/payments/payhere/notify'];

app.use('/api', apiLimiter);
app.use('/api', csrfGuard(csrfExempt));
app.use('/api', dbMiddleware);

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appearance', appearanceRoutes);
app.use('/api', notFound);

// In Docker / standalone mode, also serve the built storefront.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (!config.isServerless && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  app.get('/', (req, res) => res.json({ status: 'ok', message: 'ENNIGMA API is running' }));
}

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST && !config.isServerless) {
  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
}

connectDB();

export default app;
