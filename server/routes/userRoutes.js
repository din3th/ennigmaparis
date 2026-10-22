import express from 'express';
import {
  authUser,
  getUserProfile,
  updateUserProfile,
  registerUser,
  getUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin user management routes
router.route('/')
  .get(protect, admin, getUsers);

router.route('/:id/role')
  .put(protect, admin, updateUserRole);

router.route('/:id')
  .delete(protect, admin, deleteUser);

export default router;

