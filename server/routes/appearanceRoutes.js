import express from 'express';
import { getAppearance, updateAppearance, sendTestNotifications } from '../controllers/appearanceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAppearance)
  .put(protect, admin, updateAppearance);

router.post('/test-notifications', protect, admin, sendTestNotifications);

export default router;
