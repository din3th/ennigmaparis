import DiscountCode from '../models/DiscountCode.js';
import { evaluateDiscount } from '../services/orderService.js';
import { HttpError } from '../middleware/errorHandler.js';

// @desc    Preview a discount code against a cart subtotal (the order endpoint re-checks it)
// @route   POST /api/discounts/validate
// @access  Public
export const validateDiscountCode = async (req, res) => {
  const { code, cartTotal } = req.body;
  const discount = await DiscountCode.findOne({ code: code.toUpperCase(), isActive: true });
  const discountAmount = evaluateDiscount(discount, cartTotal);

  res.json({
    code: discount.code,
    discountType: discount.discountType,
    value: discount.value,
    discountAmount,
    message: 'Discount applied successfully',
  });
};

// @desc    Get all discount codes
// @route   GET /api/discounts
// @access  Private/Admin
export const getDiscountCodes = async (req, res) => {
  res.json(await DiscountCode.find({}).sort({ createdAt: -1 }));
};

// @desc    Create a discount code
// @route   POST /api/discounts
// @access  Private/Admin
export const createDiscountCode = async (req, res) => {
  const { code, discountType, value, minSpend, expiryDate, usageLimit } = req.body;
  if (discountType === 'percentage' && value > 100) {
    throw new HttpError(400, 'A percentage discount cannot exceed 100');
  }
  if (await DiscountCode.exists({ code: code.toUpperCase() })) {
    throw new HttpError(400, 'Discount code already exists');
  }
  const saved = await DiscountCode.create({
    code,
    discountType,
    value,
    minSpend: minSpend || 0,
    expiryDate,
    usageLimit: usageLimit || null,
  });
  res.status(201).json(saved);
};

// @desc    Delete discount code
// @route   DELETE /api/discounts/:id
// @access  Private/Admin
export const deleteDiscountCode = async (req, res) => {
  const discount = await DiscountCode.findByIdAndDelete(req.params.id);
  if (!discount) throw new HttpError(404, 'Discount code not found');
  res.json({ message: 'Discount code removed' });
};
