import app from '../server/server.js';

export default function handler(req, res) {
  try {
    return app(req, res);
  } catch (error) {
    console.error('❌ [Vercel Serverless Function Crash]:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Serverless function invocation failed',
        message: error.message,
      });
    }
  }
}
