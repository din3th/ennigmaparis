import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { setSessionCookie, clearSessionCookie } from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../utils/emailService.js';
import { HttpError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// A real bcrypt hash used to keep login timing constant when the email is unknown.
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.7Rk0A4f1bW5Zr5PfB7oDqf3r5yJ6';

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role || 'customer',
  phone: user.phone || '',
  address: user.address || null,
});

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (await User.exists({ email })) {
    throw new HttpError(400, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, phone: phone || '' });

  sendWelcomeEmail(user).catch((err) => logger.error('Welcome email failed', { err }));

  setSessionCookie(res, user);
  res.status(201).json(publicUser(user));
};

// @desc    Sign in and start a session (httpOnly cookie)
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !ok) {
    throw new HttpError(401, 'Invalid email or password');
  }

  setSessionCookie(res, user);
  res.json(publicUser(user));
};

// @desc    End the session
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = (req, res) => {
  clearSessionCookie(res);
  res.json({ message: 'Signed out' });
};

// @desc    Get the signed-in user's profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  res.json(publicUser(req.user));
};

// @desc    Update the signed-in user's profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const { name, email, phone, password, address } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new HttpError(404, 'User not found');

  if (email && email !== user.email) {
    if (await User.exists({ email, _id: { $ne: user._id } })) {
      throw new HttpError(400, 'Another account already uses this email');
    }
    user.email = email;
  }
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (password) user.passwordHash = await bcrypt.hash(password, 10);

  await user.save();
  setSessionCookie(res, user);
  res.json(publicUser(user));
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
  res.json(users);
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (String(user._id) === String(req.user._id) && req.body.role !== 'admin') {
    throw new HttpError(400, 'You cannot remove your own admin access');
  }

  user.role = req.body.role;
  await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (String(user._id) === String(req.user._id)) {
    throw new HttpError(400, 'You cannot delete your own account');
  }
  await user.deleteOne();
  res.json({ message: 'User deleted successfully' });
};
