import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
let warnedWeakSecret = false;

/**
 * Returns the JWT signing secret. There is deliberately no fallback value:
 * a missing secret would let anyone forge admin tokens.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (isProduction && secret.length < 32 && !warnedWeakSecret) {
    warnedWeakSecret = true;
    console.error('[SECURITY] JWT_SECRET is shorter than 32 characters. Rotate it to a long random value (e.g. `openssl rand -hex 32`).');
  }
  if (secret === 'supersecretjwtkeythatshouldbechanged' || secret === 'productionsecretkeyennigmaparis2026') {
    throw new Error('JWT_SECRET is set to a publicly known default value; set a unique secret');
  }
  return secret;
};

/** Validates required configuration at startup so misconfiguration fails fast. */
export const assertRequiredEnv = () => {
  getJwtSecret();
};

export const config = {
  isProduction,
  isServerless: Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
  frontendUrl: (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  currency: (process.env.STORE_CURRENCY || 'LKR').toUpperCase(),
  freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD ?? 150),
  flatShippingRate: Number(process.env.FLAT_SHIPPING_RATE ?? 15),
  sessionCookieName: 'ennigma_session',
  orderAccessCookieName: 'ennigma_orders',
  sessionMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  orderAccessMaxAgeMs: 30 * 24 * 60 * 60 * 1000,
};

/** Shipping is always computed on the server; the client only displays it. */
export const calculateShipping = (itemsPrice) =>
  itemsPrice > config.freeShippingThreshold ? 0 : config.flatShippingRate;
