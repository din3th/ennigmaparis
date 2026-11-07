import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config, getJwtSecret } from '../config/env.js';
import { verifyOrderAccessCookie } from '../utils/generateToken.js';

/** Minimal cookie parser so we don't need another dependency. */
export const parseCookies = (req, res, next) => {
  const header = req.headers.cookie;
  req.cookies = {};
  if (header) {
    for (const part of header.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      try {
        req.cookies[key] = decodeURIComponent(value);
      } catch {
        req.cookies[key] = value;
      }
    }
  }
  next();
};

/**
 * Blocks cross-site request forgery for cookie-authenticated requests:
 * every state-changing API call must carry the X-Requested-With header,
 * which browsers will not let a cross-origin form or image set.
 */
export const csrfGuard = (exemptPaths = []) => (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (exemptPaths.some((p) => req.path === p || req.originalUrl.split('?')[0] === p)) return next();
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') return next();
  return res.status(403).json({ message: 'Missing X-Requested-With header' });
};

const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return req.cookies?.[config.sessionCookieName] || null;
};

const loadUser = async (token) => {
  const decoded = jwt.verify(token, getJwtSecret());
  if (!decoded.id || decoded.type === 'order_access') return null;
  return User.findById(decoded.id).select('-passwordHash');
};

export const protect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, please sign in' });
  }
  try {
    const user = await loadUser(token);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, account not found' });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, session expired or invalid' });
  }
};

export const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      const user = await loadUser(token);
      if (user) req.user = user;
    } catch {
      // Invalid or expired token: continue as a guest.
    }
  }
  next();
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Not authorized as an admin' });
};

/**
 * For order and invoice endpoints: attaches the signed-in user (if any) and
 * the list of order ids this browser placed as a guest. The controller then
 * decides with canAccessOrder().
 */
export const protectOrderAccess = async (req, res, next) => {
  req.accessibleOrderIds = verifyOrderAccessCookie(req);
  return optionalAuth(req, res, next);
};

export const canAccessOrder = (req, order) => {
  if (!order) return false;
  if (req.user?.role === 'admin') return true;
  const orderUserId = order.user?._id || order.user;
  if (req.user && orderUserId && String(orderUserId) === String(req.user._id)) return true;
  return (req.accessibleOrderIds || []).includes(String(order._id));
};
