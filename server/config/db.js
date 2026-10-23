import mongoose from 'mongoose';

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
    console.error('❌ [Database Warning] MONGODB_URI is not set in environment variables! Data cannot sync across hosted and local.');
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('✅ Connected to MongoDB Atlas Cluster');
      return m;
    }).catch((err) => {
      cached.promise = null;
      console.error('❌ [MongoDB Atlas Connection Failed]:', err.message);
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
 * Express middleware to ensure database connection is established before route handler executes.
 * Eliminates the serverless cold-start race condition on Vercel.
 */
export const dbMiddleware = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    console.warn('[DB Middleware Warning]:', err.message);
  }
  next();
};

export default connectDB;
