import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { HttpError } from '../middleware/errorHandler.js';

// @desc    Get logged in user wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { user: req.user._id, products: [] } },
    { upsert: true, returnDocument: 'after' }
  ).populate('products');
  res.json(wishlist);
};

// @desc    Toggle product in user wishlist
// @route   POST /api/wishlist/toggle
// @access  Private
export const toggleWishlistItem = async (req, res) => {
  const { productId } = req.body;
  if (!(await Product.exists({ _id: productId }))) {
    throw new HttpError(404, 'Product not found');
  }

  const existing = await Wishlist.findOne({ user: req.user._id, products: productId });
  const action = existing ? 'removed' : 'added';
  const update = existing ? { $pull: { products: productId } } : { $addToSet: { products: productId } };

  const wishlist = await Wishlist.findOneAndUpdate({ user: req.user._id }, update, { upsert: true, returnDocument: 'after' }).populate('products');
  res.json({ wishlist, action, message: `Product ${action} ${action === 'added' ? 'to' : 'from'} wishlist` });
};
