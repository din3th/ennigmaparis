import express from 'express';
import {
  authUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  registerUser,
  getUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/register', authLimiter, validateBody(schemas.register), registerUser);
router.post('/login', authLimiter, validateBody(schemas.login), authUser);
router.post('/logout', logoutUser);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validateBody(schemas.updateProfile), updateUserProfile);

router.get('/', protect, admin, getUsers);
router.put('/:id/role', protect, admin, validateBody(schemas.role), updateUserRole);
router.delete('/:id', protect, admin, deleteUser);

export default router;
