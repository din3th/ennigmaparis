import express from 'express';
import {
  validateDiscountCode,
  getDiscountCodes,
  createDiscountCode,
  deleteDiscountCode,
} from '../controllers/discountController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/validate.js';
import { formLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/validate', formLimiter, validateBody(schemas.validateDiscount), validateDiscountCode);
router.route('/')
  .get(protect, admin, getDiscountCodes)
  .post(protect, admin, validateBody(schemas.discount), createDiscountCode);
router.delete('/:id', protect, admin, deleteDiscountCode);

export default router;
