import express from 'express';
import { addOrderItems, getOrders, getOrderById, downloadOrderInvoice, getMyOrders } from '../controllers/orderController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(optionalAuth, addOrderItems)
  .get(protect, admin, getOrders);

router.get('/myorders', protect, getMyOrders);
router.get('/:id', getOrderById);
router.get('/:id/invoice', downloadOrderInvoice);

export default router;

