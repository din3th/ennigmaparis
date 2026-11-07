import express from 'express';
import {
  addOrderItems,
  getOrders,
  getOrderById,
  downloadOrderInvoice,
  getMyOrders,
  getPricingConfig,
} from '../controllers/orderController.js';
import { protect, admin, optionalAuth, protectOrderAccess } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/validate.js';
import { orderLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.route('/')
  .post(orderLimiter, optionalAuth, validateBody(schemas.createOrder), addOrderItems)
  .get(protect, admin, getOrders);

router.get('/pricing', getPricingConfig);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protectOrderAccess, getOrderById);
router.get('/:id/invoice', protectOrderAccess, downloadOrderInvoice);

export default router;
