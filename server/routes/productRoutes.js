import express from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  requestBackInStock,
  getCategoryTree,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/validate.js';
import { formLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.get('/categories/tree', getCategoryTree);

router.route('/')
  .get(getProducts)
  .post(protect, admin, validateBody(schemas.product), createProduct);

router.get('/:slug', getProductBySlug);

router.route('/:id')
  .put(protect, admin, validateBody(schemas.product.partial()), updateProduct)
  .delete(protect, admin, deleteProduct);

router.post('/:id/reviews', protect, validateBody(schemas.review), createProductReview);
router.post('/:id/notify', formLimiter, validateBody(schemas.backInStock), requestBackInStock);

export default router;
