import express from 'express';
import {
  getAdminStats,
  updateOrderStatus,
  subscribeNewsletter,
  exportOrdersCSV,
  exportCustomersCSV,
  exportPaymentsCSV,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/validate.js';
import { formLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.get('/stats', protect, admin, getAdminStats);
router.put('/orders/:id/status', protect, admin, validateBody(schemas.orderStatus), updateOrderStatus);
router.get('/export/orders', protect, admin, exportOrdersCSV);
router.get('/export/payments', protect, admin, exportPaymentsCSV);
router.get('/export/customers', protect, admin, exportCustomersCSV);
router.post('/newsletter/subscribe', formLimiter, validateBody(schemas.newsletter), subscribeNewsletter);

export default router;
