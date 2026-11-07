import jwt from 'jsonwebtoken';
import { config, getJwtSecret } from '../config/env.js';

/** Signs a session token. Only the user id and role go in the payload. */
const generateToken = (id, role = 'customer') =>
  jwt.sign({ id: String(id), role, type: 'session' }, getJwtSecret(), {
    expiresIn: Math.floor(config.sessionMaxAgeMs / 1000),
  });

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge,
});

/** Issues the httpOnly session cookie (not readable by page JavaScript). */
export const setSessionCookie = (res, user) => {
  res.cookie(config.sessionCookieName, generateToken(user._id, user.role), cookieOptions(config.sessionMaxAgeMs));
};

export const clearSessionCookie = (res) => {
  res.clearCookie(config.sessionCookieName, { ...cookieOptions(0), maxAge: undefined });
};

/**
 * Grants a guest browser access to the given order by adding its id to a
 * signed, httpOnly cookie. Replaces the old per-order tokens in localStorage
 * and URL query strings.
 */
export const grantOrderAccess = (req, res, orderId) => {
  const existing = verifyOrderAccessCookie(req);
  const orderIds = [...new Set([String(orderId), ...existing])].slice(0, 50);
  const token = jwt.sign({ type: 'order_access', orderIds }, getJwtSecret(), {
    expiresIn: Math.floor(config.orderAccessMaxAgeMs / 1000),
  });
  res.cookie(config.orderAccessCookieName, token, cookieOptions(config.orderAccessMaxAgeMs));
};

export const verifyOrderAccessCookie = (req) => {
  const token = req.cookies?.[config.orderAccessCookieName];
  if (!token) return [];
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded.type === 'order_access' && Array.isArray(decoded.orderIds) ? decoded.orderIds.map(String) : [];
  } catch {
    return [];
  }
};

export default generateToken;
