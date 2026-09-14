import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Newsletter from '../models/Newsletter.js';

// @desc    Get Admin Dashboard Stats Overview with Chart Trends
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

    // Aggregate monthly revenue for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const allOrders = await Order.find({ createdAt: { $gte: sixMonthsAgo } });

    const monthsMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      monthsMap[monthKey] = 0;
    }

    allOrders.forEach((o) => {
      const monthKey = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
      if (monthsMap[monthKey] !== undefined) {
        monthsMap[monthKey] += (o.total || 0);
      }
    });

    const monthlyRevenue = Object.keys(monthsMap).map((month) => ({
      month,
      revenue: Number(monthsMap[month].toFixed(2)),
    }));

    // Category breakdown
    const allProducts = await Product.find({});
    const categoryCount = {};
    allProducts.forEach((p) => {
      const cat = p.category || 'Other';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.keys(categoryCount).map((name) => ({
      name,
      value: categoryCount[name],
    }));

    res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      totalProducts,
      totalCustomers,
      outOfStockProducts,
      pendingOrdersCount,
      recentOrders,
      monthlyRevenue,
      categoryBreakdown,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error loading admin statistics' });
  }
};

// @desc    Export Orders CSV
// @route   GET /api/admin/export/orders
// @access  Private/Admin
export const exportOrdersCSV = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email');

    let csv = 'Order ID,Customer Name,Customer Email,Payment Method,Payment Status,Order Status,Total (LKR),Date\n';
    orders.forEach((o) => {
      const name = (o.guestName || (o.user && o.user.name) || 'Guest').replace(/,/g, '');
      const email = (o.guestEmail || (o.user && o.user.email) || '').replace(/,/g, '');
      const date = new Date(o.createdAt).toISOString().split('T')[0];
      csv += `${o._id},"${name}","${email}",${o.paymentMethod},${o.paymentStatus},${o.orderStatus},${o.total},${date}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders-export.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export orders CSV' });
  }
};

// @desc    Export Customers CSV
// @route   GET /api/admin/export/customers
// @access  Private/Admin
export const exportCustomersCSV = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 });

    let csv = 'User ID,Name,Email,Joined Date\n';
    customers.forEach((c) => {
      const name = (c.name || '').replace(/,/g, '');
      const date = new Date(c.createdAt).toISOString().split('T')[0];
      csv += `${c._id},"${name}","${c.email}",${date}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers-export.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export customers CSV' });
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
