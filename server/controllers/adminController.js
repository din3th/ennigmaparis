import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Newsletter from '../models/Newsletter.js';

// @desc    Get Admin Dashboard Stats Overview
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Calculate total revenue from completed/shipped/delivered orders
    const orders = await Order.find({ paymentStatus: 'Completed' });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    const outOfStockProducts = await Product.countDocuments({ stock: { $lte: 0 } });
    const pendingOrdersCount = await Order.countDocuments({ orderStatus: 'Pending' });

    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      totalProducts,
      totalCustomers,
      outOfStockProducts,
      pendingOrdersCount,
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error loading admin statistics' });
  }
};

// @desc    Update Order Status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' });
  }
};

// @desc    Newsletter subscription signup
// @route   POST /api/admin/newsletter/subscribe
// @access  Public
export const subscribeNewsletter = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(200).json({ message: 'You are already subscribed to the ENNIGMA newsletter.' });
    }

    await Newsletter.create({ email: email.toLowerCase() });
    res.status(201).json({ message: 'Welcome to ENNIGMA PARIS newsletter! Check your inbox for exclusive updates.' });
  } catch (error) {
    res.status(500).json({ message: 'Subscription failed' });
  }
};
