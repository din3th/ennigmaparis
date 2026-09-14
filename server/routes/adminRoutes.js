import express from 'express';
import { getAdminStats, updateOrderStatus, subscribeNewsletter, exportOrdersCSV, exportCustomersCSV } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getAdminStats);
router.put('/orders/:id/status', protect, admin, updateOrderStatus);
router.get('/export/orders', protect, admin, exportOrdersCSV);
router.get('/export/customers', protect, admin, exportCustomersCSV);
router.post('/newsletter/subscribe', subscribeNewsletter);

export default router;

