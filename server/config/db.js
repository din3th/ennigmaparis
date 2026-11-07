import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Global connection cache for serverless environments (Vercel / Netlify / AWS Lambda).
 * Prevents opening duplicate connections on every lambda cold-start.
 */
let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

export const connectDB = async () => {
  // If already connected, reuse existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!MONGODB_URI) {
    logger.error('MONGODB_URI is not set; the API cannot serve requests');
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      logger.info('Connected to MongoDB');
      return m;
    }).catch((err) => {
      cached.promise = null;
      logger.error('MongoDB connection failed', { err });
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    return null;
  }
};

/**
 * Express middleware to ensure the database is connected before a route runs.
 * Fails with 503 instead of letting handlers fall back to fake in-memory data.
 */
export const dbMiddleware = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch {
      // handled below
    }
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Service temporarily unavailable. Please try again shortly.' });
  }
  next();
};

export default connectDB;
