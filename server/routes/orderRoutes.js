import express from 'express';
import { addOrderItems, getOrders, getOrderById, downloadOrderInvoice } from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(addOrderItems)
  .get(protect, admin, getOrders);

router.get('/:id', getOrderById);
router.get('/:id/invoice', downloadOrderInvoice);

export default router;

