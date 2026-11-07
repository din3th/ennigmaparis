import Order from '../models/Order.js';
import Appearance from '../models/Appearance.js';
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from '../utils/emailService.js';
import { sendAdminOrderWhatsAppAlerts } from '../utils/whatsappService.js';
import { sendAdminOrderTelegramAlert } from '../utils/telegramService.js';
import { priceAndReserveOrder } from '../services/orderService.js';
import { grantOrderAccess } from '../utils/generateToken.js';
import { canAccessOrder } from '../middleware/authMiddleware.js';
import { HttpError } from '../middleware/errorHandler.js';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

const triggerOrderNotifications = async (order) => {
  sendOrderConfirmationEmail(order).catch((err) => logger.error('Customer confirmation email failed', { err }));

  let notifSettings = {};
  try {
    const doc = await Appearance.findOne().select('notificationSettings');
    if (doc?.notificationSettings) notifSettings = doc.notificationSettings;
  } catch (err) {
    logger.warn('Could not load notification settings', { err });
  }

  if (notifSettings.enableEmailAlerts !== false) {
    sendAdminOrderNotificationEmail(order, notifSettings).catch((err) => logger.error('Admin order email failed', { err }));
  }
  if (notifSettings.enableWhatsAppAlerts !== false) {
    sendAdminOrderWhatsAppAlerts(order, notifSettings).catch((err) => logger.error('Admin WhatsApp alert failed', { err }));
  }
  sendAdminOrderTelegramAlert(order).catch((err) => logger.error('Admin Telegram alert failed', { err }));
};

// @desc    Public pricing rules so the checkout can display what the server will charge
// @route   GET /api/orders/pricing
// @access  Public
export const getPricingConfig = (req, res) => {
  res.json({
    currency: config.currency,
    freeShippingThreshold: config.freeShippingThreshold,
    flatShippingRate: config.flatShippingRate,
  });
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (guest or signed-in checkout)
export const addOrderItems = async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, discountCode, guestName, guestPhone, transferReceipt } = req.body;
  const guestEmail = req.body.guestEmail || req.user?.email;

  if (!guestEmail) {
    throw new HttpError(400, 'An email address is required to place an order');
  }

  const priced = await priceAndReserveOrder({ orderItems, discountCode });

  let order;
  try {
    order = await Order.create({
      user: req.user?._id || null,
      guestEmail,
      guestName: guestName || req.user?.name || '',
      guestPhone: guestPhone || req.user?.phone || '',
      items: priced.items,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      transferReceipt: paymentMethod === 'Bank Transfer' ? { ...transferReceipt, uploadedAt: new Date() } : undefined,
      currency: config.currency,
      itemsPrice: priced.itemsPrice,
      shippingPrice: priced.shippingPrice,
      discountCode: priced.discountCode,
      discountAmount: priced.discountAmount,
      total: priced.total,
      statusHistory: [{ orderStatus: 'Pending', paymentStatus: 'Pending', note: 'Order placed' }],
    });
  } catch (err) {
    await priced.rollback();
    throw err;
  }

  grantOrderAccess(req, res, order._id);
  triggerOrderNotifications(order);

  res.status(201).json(order);
};

// @desc    Get the signed-in user's orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  // Only orders linked to this account. Matching by email would expose guest
  // orders to anyone who registers with that address (emails are not verified).
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email');
  res.json(orders);
};

const findAuthorizedOrder = async (req, populate = 'name email') => {
  const order = await Order.findById(req.params.id).populate('user', populate);
  // Same response for "missing" and "not yours" so ids can't be probed.
  if (!order || !canAccessOrder(req, order)) {
    throw new HttpError(404, 'Order not found');
  }
  return order;
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Admin, order owner, or the guest browser that placed it
export const getOrderById = async (req, res) => {
  res.json(await findAuthorizedOrder(req));
};

// @desc    Download or view order PDF invoice
// @route   GET /api/orders/:id/invoice
// @access  Admin, order owner, or the guest browser that placed it
export const downloadOrderInvoice = async (req, res) => {
  const order = await findAuthorizedOrder(req, 'name email phone');
  const { generateInvoicePDF } = await import('../utils/pdfInvoiceGenerator.js');
  generateInvoicePDF(order, res, req.query.download === 'true');
};
