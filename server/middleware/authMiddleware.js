import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeythatshouldbechanged');

      const mongoose = (await import('mongoose')).default;
      let foundUser = null;

      if (mongoose.connection.readyState === 1) {
        try {
          foundUser = await User.findById(decoded.id).select('-passwordHash');
        } catch (dbErr) {
          console.warn('DB user lookup warning:', dbErr.message);
        }
      }

      if (!foundUser) {
        return res.status(401).json({ message: 'Not authorized, user account not found or deactivated' });
      }

      req.user = foundUser;
      return next();
    } catch (error) {
      console.error('Token validation error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeythatshouldbechanged');

      const mongoose = (await import('mongoose')).default;
      let foundUser = null;
      if (mongoose.connection.readyState === 1) {
        try {
          foundUser = await User.findById(decoded.id).select('-passwordHash');
        } catch (dbErr) {}
      }

      if (foundUser) {
        req.user = foundUser;
      }
    } catch (e) {}
  }
  next();
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

/**
 * Middleware for securing order and invoice endpoints.
 * Accepts Bearer token in Authorization header OR token in query param.
 * Can be an authenticated User token or a guest Order Access token.
 */
export const protectOrderAccess = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeythatshouldbechanged');

      if (decoded.type === 'order_access') {
        req.orderAccess = decoded;
        return next();
      }

      if (decoded.id) {
        try {
          const mongoose = (await import('mongoose')).default;
          if (mongoose.connection.readyState === 1) {
            const foundUser = await User.findById(decoded.id).select('-passwordHash');
            if (foundUser) {
              req.user = foundUser;
              return next();
            }
          }
        } catch (dbErr) {
          console.warn('DB lookup in protectOrderAccess:', dbErr.message);
        }

        // Cryptographically verified admin payload fallback
        if (decoded.role === 'admin') {
          req.user = {
            _id: decoded.id,
            role: 'admin',
            email: decoded.email,
            name: decoded.name || 'Admin',
          };
          return next();
        } else if (decoded.email) {
          req.user = {
            _id: decoded.id,
            role: decoded.role || 'customer',
            email: decoded.email,
            name: decoded.name,
          };
          return next();
        }
      }
    } catch (err) {
      console.warn('Order token verification failed:', err.message);
    }
  }

  next();
};
