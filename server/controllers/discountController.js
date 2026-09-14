import DiscountCode from '../models/DiscountCode.js';

// @desc    Validate discount code
// @route   POST /api/discounts/validate
// @access  Public
export const validateDiscountCode = async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Discount code is required' });
  }

  try {
    const discount = await DiscountCode.findOne({ code: code.toUpperCase(), isActive: true });

    if (!discount) {
      return res.status(404).json({ message: 'Invalid or expired discount code' });
    }

    if (discount.expiryDate && new Date(discount.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Discount code has expired' });
    }

    if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
      return res.status(400).json({ message: 'Discount code usage limit reached' });
    }

    if (cartTotal && cartTotal < discount.minSpend) {
      return res.status(400).json({ message: `Minimum spend of $${discount.minSpend} required for this code` });
    }

    let discountAmount = 0;
    if (discount.discountType === 'percentage') {
      discountAmount = (cartTotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }

    // Ensure discount doesn't exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal || 0);

    res.json({
      code: discount.code,
      discountType: discount.discountType,
      value: discount.value,
      discountAmount: Number(discountAmount.toFixed(2)),
      message: 'Discount applied successfully',
    });
  } catch (error) {
    console.error('Error validating discount code:', error);
    res.status(500).json({ message: 'Server error validating discount code' });
  }
};

// @desc    Get all discount codes
// @route   GET /api/discounts
// @access  Private/Admin
export const getDiscountCodes = async (req, res) => {
  try {
    const discounts = await DiscountCode.find({}).sort({ createdAt: -1 });
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching discount codes' });
  }
};

// @desc    Create a discount code
// @route   POST /api/discounts
// @access  Private/Admin
export const createDiscountCode = async (req, res) => {
  try {
    const { code, discountType, value, minSpend, expiryDate, usageLimit } = req.body;
    const existing = await DiscountCode.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Discount code already exists' });
    }

    const discount = new DiscountCode({
      code,
      discountType,
      value,
      minSpend: minSpend || 0,
      expiryDate,
      usageLimit: usageLimit || null,
    });

    const saved = await discount.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error creating discount code' });
  }
};

// @desc    Delete discount code
// @route   DELETE /api/discounts/:id
// @access  Private/Admin
export const deleteDiscountCode = async (req, res) => {
  try {
    const discount = await DiscountCode.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount code not found' });
    }
    await discount.deleteOne();
    res.json({ message: 'Discount code removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting discount code' });
  }
};
