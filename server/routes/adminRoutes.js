import express from 'express';
import { getAdminStats, updateOrderStatus, subscribeNewsletter } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getAdminStats);
router.put('/orders/:id/status', protect, admin, updateOrderStatus);
router.post('/newsletter/subscribe', subscribeNewsletter);

export default router;
