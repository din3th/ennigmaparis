import express from 'express';
import { z } from 'zod';
import { getWishlist, toggleWishlistItem } from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody, objectId } from '../middleware/validate.js';

const router = express.Router();

router.get('/', protect, getWishlist);
router.post('/toggle', protect, validateBody(z.object({ productId: objectId })), toggleWishlistItem);

export default router;
