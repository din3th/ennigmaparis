import Product from '../models/Product.js';
import DiscountCode from '../models/DiscountCode.js';
import { HttpError } from '../middleware/errorHandler.js';
import { calculateShipping } from '../config/env.js';

const round2 = (n) => Math.round(n * 100) / 100;

/** The price a customer pays for a product right now. */
export const effectivePrice = (product) =>
  product.salePrice && product.salePrice > 0 && product.salePrice < product.price
    ? product.salePrice
    : product.price;

/** Computes a discount amount for a cart subtotal, or throws why the code can't be used. */
export const evaluateDiscount = (discount, itemsPrice) => {
  if (!discount) throw new HttpError(400, 'Invalid or expired discount code');
  if (discount.expiryDate && new Date(discount.expiryDate) < new Date()) {
    throw new HttpError(400, 'Discount code has expired');
  }
  if (discount.startDate && new Date(discount.startDate) > new Date()) {
    throw new HttpError(400, 'Discount code is not active yet');
  }
  if (discount.usageLimit !== null && discount.usageLimit !== undefined && discount.usageCount >= discount.usageLimit) {
    throw new HttpError(400, 'Discount code usage limit reached');
  }
  if (discount.minSpend && itemsPrice < discount.minSpend) {
    throw new HttpError(400, `Minimum spend of ${discount.minSpend} required for this code`);
  }
  const raw = discount.discountType === 'percentage' ? (itemsPrice * discount.value) / 100 : discount.value;
  return round2(Math.min(raw, itemsPrice));
};

/** Adds stock back for each item (used on rollback and on cancellation). */
export const restoreStock = async (items) => {
  await Promise.all(
    items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } }))
  );
};

/**
 * Builds a priced order from client-supplied product ids and quantities.
 * Prices, shipping and discounts all come from the database. Stock is
 * reserved atomically; if anything fails the reservation is rolled back.
 *
 * Returns { items, itemsPrice, shippingPrice, discountAmount, discountCode, total, rollback }.
 */
export const priceAndReserveOrder = async ({ orderItems, discountCode }) => {
  const ids = [...new Set(orderItems.map((i) => i.product))];
  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = orderItems.map((line) => {
    const product = byId.get(String(line.product));
    if (!product) {
      throw new HttpError(400, 'One of the items in your bag is no longer available');
    }
    if (line.size && product.sizes?.length && !product.sizes.includes(line.size)) {
      throw new HttpError(400, `Size ${line.size} is not available for ${product.name}`);
    }
    return {
      product: product._id,
      name: product.name,
      qty: line.qty,
      size: line.size || product.sizes?.[0] || '',
      price: effectivePrice(product),
      image: product.images?.[0] || '',
    };
  });

  const itemsPrice = round2(items.reduce((sum, i) => sum + i.price * i.qty, 0));

  // Reserve stock atomically: the update only matches while enough stock remains.
  const reserved = [];
  const releaseStock = () => restoreStock(reserved);
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.qty } },
      { $inc: { stock: -item.qty } }
    );
    if (result.modifiedCount !== 1) {
      await releaseStock();
      throw new HttpError(409, `Sorry, ${item.name} does not have enough stock left`);
    }
    reserved.push(item);
  }

  let discountAmount = 0;
  let appliedCode = '';
  let releaseDiscount = async () => {};
  try {
    if (discountCode) {
      const code = discountCode.toUpperCase().trim();
      const discount = await DiscountCode.findOne({ code, isActive: true });
      discountAmount = evaluateDiscount(discount, itemsPrice);

      // Claim one use atomically so concurrent orders cannot exceed the limit.
      const claimed = await DiscountCode.findOneAndUpdate(
        {
          _id: discount._id,
          $or: [{ usageLimit: null }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }],
        },
        { $inc: { usageCount: 1 } },
        { returnDocument: 'after' }
      );
      if (!claimed) throw new HttpError(400, 'Discount code usage limit reached');
      appliedCode = discount.code;
      releaseDiscount = () => DiscountCode.updateOne({ _id: discount._id }, { $inc: { usageCount: -1 } });
    }
  } catch (err) {
    await releaseStock();
    throw err;
  }

  const shippingPrice = calculateShipping(itemsPrice);
  const total = round2(Math.max(0, itemsPrice + shippingPrice - discountAmount));

  return {
    items,
    itemsPrice,
    shippingPrice,
    discountAmount,
    discountCode: appliedCode,
    total,
    rollback: async () => {
      await releaseStock();
      await releaseDiscount();
    },
  };
};
