import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Newsletter from '../models/Newsletter.js';
import { sendOrderStatusUpdateEmail } from '../utils/emailService.js';
import { restoreStock } from '../services/orderService.js';
import { HttpError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// @desc    Get Admin Dashboard Stats Overview with Chart Trends
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalOrders, totalProducts, totalCustomers, revenueAgg, outOfStockProducts,
    pendingOrdersCount, recentOrders, monthlyAgg, categoryAgg,
  ] = await Promise.all([
    Order.countDocuments({}),
    Product.countDocuments({}),
    User.countDocuments({ role: 'customer' }),
    Order.aggregate([{ $match: { paymentStatus: 'Completed' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Product.countDocuments({ stock: { $lte: 0 } }),
    Order.countDocuments({ orderStatus: 'Pending' }),
    Order.find({}).sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, revenue: { $sum: '$total' } } },
    ]),
    Product.aggregate([{ $group: { _id: { $ifNull: ['$category', 'Other'] }, value: { $sum: 1 } } }]),
  ]);

  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const hit = monthlyAgg.find((r) => r._id.y === d.getFullYear() && r._id.m === d.getMonth() + 1);
    monthlyRevenue.push({
      month: d.toLocaleString('en-US', { month: 'short' }),
      revenue: Number((hit?.revenue || 0).toFixed(2)),
    });
  }

  res.json({
    totalRevenue: Number((revenueAgg[0]?.total || 0).toFixed(2)),
    totalOrders,
    totalProducts,
    totalCustomers,
    outOfStockProducts,
    pendingOrdersCount,
    recentOrders,
    monthlyRevenue,
    categoryBreakdown: categoryAgg.map((c) => ({ name: c._id, value: c.value })),
  });
};


// Helper to sanitize CSV elements against CSV Formula / DDE Injection (CWE-1236)
const sanitizeCSV = (value) => {
  if (value === null || value === undefined) return '';
  let str = String(value).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return str;
};

// @desc    Export Orders CSV
// @route   GET /api/admin/export/orders
// @access  Private/Admin
export const exportOrdersCSV = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email phone');

    let csv = 'Order ID,Customer Name,Customer Email,Customer Phone,Delivery Street,City,Country,Payment Method,Payment Status,Order Status,Total (LKR),Tracking Number,Carrier,Payment Slip Attached,Date\n';
    orders.forEach((o) => {
      const name = sanitizeCSV(o.guestName || (o.user && o.user.name) || 'Guest');
      const email = sanitizeCSV(o.guestEmail || (o.user && o.user.email) || '');
      const phone = sanitizeCSV(o.guestPhone || (o.user && o.user.phone) || '');
      const street = sanitizeCSV(o.shippingAddress?.street || '');
      const city = sanitizeCSV(o.shippingAddress?.city || '');
      const country = sanitizeCSV(o.shippingAddress?.country || 'Sri Lanka');
      const paymentMethod = sanitizeCSV(o.paymentMethod || '');
      const paymentStatus = sanitizeCSV(o.paymentStatus || '');
      const orderStatus = sanitizeCSV(o.orderStatus || '');
      const total = Number(o.total) || 0;
      const tracking = sanitizeCSV(o.trackingNumber || '');
      const carrier = sanitizeCSV(o.carrier || '');
      const hasSlip = o.transferReceipt?.url ? 'YES' : 'NO';
      const date = new Date(o.createdAt).toISOString().split('T')[0];

      csv += `${o._id},"${name}","${email}","${phone}","${street}","${city}","${country}","${paymentMethod}","${paymentStatus}","${orderStatus}",${total},"${tracking}","${carrier}","${hasSlip}",${date}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ennigma-orders-export.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Failed to export orders CSV:', error);
    res.status(500).json({ message: 'Failed to export orders CSV' });
  }
};

// @desc    Export Payment Confirmations & Verification Report CSV
// @route   GET /api/admin/export/payments
// @access  Private/Admin
export const exportPaymentsCSV = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email phone');

    let csv = 'Order ID,Customer Name,Customer Email,Customer Phone,Payment Method,Payment Status,Total Amount (LKR),Order Status,Slip Filename,Slip URL,Slip Upload Date,Order Date\n';
    orders.forEach((o) => {
      const name = sanitizeCSV(o.guestName || (o.user && o.user.name) || 'Guest');
      const email = sanitizeCSV(o.guestEmail || (o.user && o.user.email) || '');
      const phone = sanitizeCSV(o.guestPhone || (o.user && o.user.phone) || '');
      const paymentMethod = sanitizeCSV(o.paymentMethod || 'Unknown');
      const paymentStatus = sanitizeCSV(o.paymentStatus || 'Pending');
      const total = Number(o.total) || 0;
      const orderStatus = sanitizeCSV(o.orderStatus || '');
      const slipFilename = sanitizeCSV(o.transferReceipt?.originalName || o.transferReceipt?.filename || 'N/A');
      const slipUrl = sanitizeCSV(o.transferReceipt?.url || 'N/A');
      const slipUploadDate = o.transferReceipt?.uploadedAt ? new Date(o.transferReceipt.uploadedAt).toISOString().split('T')[0] : 'N/A';
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];

      csv += `${o._id},"${name}","${email}","${phone}","${paymentMethod}","${paymentStatus}",${total},"${orderStatus}","${slipFilename}","${slipUrl}","${slipUploadDate}",${orderDate}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ennigma-payment-confirmations.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Failed to export payments report CSV:', error);
    res.status(500).json({ message: 'Failed to export payments CSV' });
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
      const name = sanitizeCSV(c.name || '');
      const email = sanitizeCSV(c.email || '');
      const date = new Date(c.createdAt).toISOString().split('T')[0];
      csv += `${c._id},"${name}","${email}",${date}\n`;
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
  const { orderStatus, paymentStatus, trackingNumber, carrier, trackingUrl, dispatchNote } = req.body;

  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new HttpError(404, 'Order not found');

  const previousStatus = order.orderStatus;
  const previousPayment = order.paymentStatus;
  if (orderStatus) order.orderStatus = orderStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (carrier !== undefined) order.carrier = carrier;
  if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;
  if (dispatchNote !== undefined) order.dispatchNote = dispatchNote;

  // Cancelling returns the reserved stock (once).
  if (order.orderStatus === 'Cancelled' && previousStatus !== 'Cancelled' && !order.stockRestored) {
    await restoreStock(order.items);
    order.stockRestored = true;
  }

  if (order.orderStatus !== previousStatus || order.paymentStatus !== previousPayment) {
    order.statusHistory.push({
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      note: dispatchNote || undefined,
      changedBy: req.user._id,
    });
  }

  const updatedOrder = await order.save();

  if (orderStatus && orderStatus !== previousStatus) {
    sendOrderStatusUpdateEmail(updatedOrder, previousStatus, orderStatus, {
      trackingNumber: updatedOrder.trackingNumber,
      carrier: updatedOrder.carrier,
      trackingUrl: updatedOrder.trackingUrl,
      dispatchNote: updatedOrder.dispatchNote,
    }).catch((err) => logger.error('Order status email failed', { err }));
  }

  res.json(updatedOrder);
};

// @desc    Newsletter subscription signup
// @route   POST /api/admin/newsletter/subscribe
// @access  Public
export const subscribeNewsletter = async (req, res) => {
  const { email } = req.body;
  const result = await Newsletter.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
  if (result.upsertedCount === 0) {
    return res.status(200).json({ message: 'You are already subscribed to the ENNIGMA newsletter.' });
  }
  res.status(201).json({ message: 'Welcome to ENNIGMA PARIS newsletter! Check your inbox for exclusive updates.' });
};
