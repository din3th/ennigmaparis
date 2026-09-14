import Order from '../models/Order.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (Guest Checkout)
export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentStatus,
    paymentResult,
    itemsPrice,
    shippingPrice,
    discountCode,
    discountAmount,
    totalPrice,
    guestEmail,
    guestName,
    guestPhone,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  }

  try {
    const order = new Order({
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentStatus || 'Pending',
      paymentResult,
      itemsPrice: itemsPrice || totalPrice,
      shippingPrice: shippingPrice || 0,
      discountCode: discountCode || '',
      discountAmount: discountAmount || 0,
      total: totalPrice,
      guestEmail,
      guestName,
      guestPhone,
      user: req.user ? req.user._id : null,
    });

    const createdOrder = await order.save();

    // Trigger email notification asynchronously
    sendOrderConfirmationEmail(createdOrder).catch(err => console.error('Email trigger error:', err));

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'id name email');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};
