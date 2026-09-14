import express from 'express';
import {
  createStripeIntent,
  generatePayHereHash,
  confirmCodOrder,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/stripe/create-intent', createStripeIntent);
router.post('/payhere/hash', generatePayHereHash);
router.post('/cod/confirm', confirmCodOrder);

export default router;
