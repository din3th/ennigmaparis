import express from 'express';
import {
  createStripeCheckoutSession,
  handleStripeWebhook,
  createPayHereCheckout,
  handlePayHereNotify,
} from '../controllers/paymentController.js';
import { protectOrderAccess } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/validate.js';
import { paymentLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/stripe/checkout-session', paymentLimiter, protectOrderAccess, validateBody(schemas.orderIdBody), createStripeCheckoutSession);
router.post('/payhere/checkout', paymentLimiter, protectOrderAccess, validateBody(schemas.orderIdBody), createPayHereCheckout);

// Gateway callbacks: authenticated by signature, not by session.
router.post('/webhook', handleStripeWebhook);
router.post('/payhere/notify', handlePayHereNotify);

export default router;
