import express from 'express';
import {
  createStripeIntent,
  generatePayHereHash,
  confirmCodOrder,
  handleStripeWebhook,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/stripe/create-intent', createStripeIntent);
router.post('/payhere/hash', generatePayHereHash);
router.post('/cod/confirm', confirmCodOrder);
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;

