import express from 'express';
import {
  validateDiscountCode,
  getDiscountCodes,
  createDiscountCode,
  deleteDiscountCode,
} from '../controllers/discountController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/validate', validateDiscountCode);
router.route('/')
  .get(protect, admin, getDiscountCodes)
  .post(protect, admin, createDiscountCode);

router.route('/:id')
  .delete(protect, admin, deleteDiscountCode);

export default router;
