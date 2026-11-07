import rateLimit from 'express-rate-limit';
import MongoRateLimitStore from '../utils/mongoRateLimitStore.js';

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

const make = (prefix, windowMs, limit, message) => {
  if (isTest) return (req, res, next) => next();
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: new MongoRateLimitStore({ prefix }),
    // If MongoDB is briefly unreachable, let requests through rather than
    // locking every customer out.
    passOnStoreError: true,
    message: { message },
  });
};

const MIN = 60 * 1000;

export const apiLimiter = make('api', 15 * MIN, 600, 'Too many requests, please try again later.');
export const authLimiter = make('auth', 15 * MIN, 20, 'Too many attempts, please try again in 15 minutes.');
export const paymentLimiter = make('pay', 15 * MIN, 30, 'Too many payment attempts, please try again later.');
export const orderLimiter = make('order', 15 * MIN, 20, 'Too many orders from this network, please try again later.');
export const receiptUploadLimiter = make('receipt', 60 * MIN, 10, 'Too many uploads, please try again later.');
export const formLimiter = make('form', 15 * MIN, 30, 'Too many requests, please try again later.');
