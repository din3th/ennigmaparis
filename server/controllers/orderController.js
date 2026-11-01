import jwt from 'jsonwebtoken';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import DiscountCode from '../models/DiscountCode.js';
import Appearance from '../models/Appearance.js';
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from '../utils/emailService.js';
import { sendAdminOrderWhatsAppAlerts } from '../utils/whatsappService.js';
import { sendAdminOrderTelegramAlert } from '../utils/telegramService.js';

const triggerOrderNotifications = async (orderData) => {
  // 1. Send confirmation email to customer
  sendOrderConfirmationEmail(orderData).catch(err => console.error('Customer confirmation email error:', err.message));

  // 2. Retrieve notification settings from database
  let notifSettings = {};
  try {
    const doc = await Appearance.findOne().select('notificationSettings');
    if (doc?.notificationSettings) {
      notifSettings = doc.notificationSettings;
    }
  } catch {}

  // 3. Send executive order alert email to Owner & Manager
  if (notifSettings.enableEmailAlerts !== false) {
    sendAdminOrderNotificationEmail(orderData, notifSettings).catch(err => console.error('Admin order email alert error:', err.message));
  }

  // 4. Send executive WhatsApp order alert to Owner & Manager
  if (notifSettings.enableWhatsAppAlerts !== false) {
    sendAdminOrderWhatsAppAlerts(orderData, notifSettings).catch(err => console.error('Admin order WhatsApp alert error:', err.message));
  }

  // 5. Send instant Telegram push alert to Owner if configured
  sendAdminOrderTelegramAlert(orderData).catch(err => console.error('Admin order Telegram alert error:', err.message));
};

const inMemoryOrders = [
  {
    _id: 'ORD-1792648800101',
    guestName: 'Madame Sophie Laurent',
    guestEmail: 'sophie.laurent@paris.fr',
    paymentMethod: 'Stripe Credit Card',
    paymentStatus: 'Completed',
    orderStatus: 'Processing',
    itemsPrice: 12500,
    shippingPrice: 0,
    discountAmount: 0,
    total: 12500,
    createdAt: new Date(Date.now() - 86400000 * 2),
    items: [
      {
        name: 'MANGO Black Mini Dress',
        qty: 1,
        price: 12500,
        size: 'UK 8',
        image: 'https://plus.unsplash.com/premium_photo-1664202526559-e21e9c0fb46a?q=80&w=800',
      },
    ],
    shippingAddress: {
      street: '12 Rue de la Paix',
      city: 'Paris',
      state: 'IDF',
      zip: '75002',
      country: 'France',
    },
  },
];

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (Guest Checkout / Authenticated Checkout)
export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentResult,
    shippingPrice,
    discountCode,
    guestEmail,
    guestName,
    guestPhone,
    transferReceipt,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items provided' });
  }

  const formattedItems = orderItems.map((item) => ({
    product: item.product || item._id || item.id || null,
    name: item.name || item.title || 'Luxury Apparel Item',
    qty: Number(item.qty) || 1,
    size: item.size || 'M',
    price: Number(item.price) || 0,
    image: item.image || (item.images && item.images[0]) || '',
  }));

  const orderId = 'ORD-' + Date.now();
  const userId = req.user ? (req.user._id || req.user.id) : null;

  try {
    const mongoose = (await import('mongoose')).default;

    // Server-side price calculation: Validate item prices against database records
    let calculatedItemsPrice = 0;
    const productIds = formattedItems
      .map((i) => i.product)
      .filter((p) => p && mongoose.isValidObjectId(p));

    let dbProducts = [];
    if (mongoose.connection.readyState === 1 && productIds.length > 0) {
      try {
        dbProducts = await Product.find({ _id: { $in: productIds } });
      } catch (e) {}
    }

    formattedItems.forEach((item) => {
      const dbProd = dbProducts.find((p) => String(p._id) === String(item.product));
      if (dbProd) {
        item.price = dbProd.salePrice || dbProd.price;
      }
      calculatedItemsPrice += (Number(item.price) || 0) * (Number(item.qty) || 1);
    });

    // Server-side discount verification
    let validatedDiscountAmount = 0;
    let validatedDiscountCode = '';
    if (discountCode && mongoose.connection.readyState === 1) {
      try {
        const discount = await DiscountCode.findOne({
          code: String(discountCode).toUpperCase().trim(),
          isActive: true,
        });
        if (discount) {
          const notExpired = !discount.expiryDate || new Date(discount.expiryDate) >= new Date();
          const withinLimit = discount.usageLimit === null || discount.usageCount < discount.usageLimit;
          const meetsMin = !discount.minSpend || calculatedItemsPrice >= discount.minSpend;
          if (notExpired && withinLimit && meetsMin) {
            validatedDiscountCode = discount.code;
            if (discount.discountType === 'percentage') {
              validatedDiscountAmount = (calculatedItemsPrice * discount.value) / 100;
            } else {
              validatedDiscountAmount = discount.value;
            }
            validatedDiscountAmount = Math.min(validatedDiscountAmount, calculatedItemsPrice);
          }
        }
      } catch (e) {}
    }

    const parsedShipping = Number(shippingPrice) || 0;
    const validatedTotal = Math.max(0, calculatedItemsPrice + parsedShipping - validatedDiscountAmount);

    // Enforce initial Pending payment status to prevent client-side payment status spoofing
    const initialPaymentStatus = 'Pending';

    if (mongoose.connection.readyState === 1) {
      const order = new Order({
        items: formattedItems,
        shippingAddress: shippingAddress || { street: 'N/A', city: 'N/A', state: 'N/A', zip: '00000', country: 'Sri Lanka' },
        paymentMethod: paymentMethod || 'COD',
        paymentStatus: initialPaymentStatus,
        paymentResult,
        transferReceipt: transferReceipt || null,
        itemsPrice: Number(calculatedItemsPrice.toFixed(2)),
        shippingPrice: parsedShipping,
        discountCode: validatedDiscountCode,
        discountAmount: Number(validatedDiscountAmount.toFixed(2)),
        total: Number(validatedTotal.toFixed(2)),
        guestEmail,
        guestName,
        guestPhone,
        user: userId,
      });

      const createdOrder = await order.save();
      const orderObj = createdOrder.toObject ? createdOrder.toObject() : createdOrder;
      inMemoryOrders.unshift(orderObj);
      triggerOrderNotifications(createdOrder);

      const orderAccessToken = jwt.sign(
        { orderId: createdOrder._id, email: guestEmail || (req.user && req.user.email) || '', type: 'order_access' },
        process.env.JWT_SECRET || 'supersecretjwtkeythatshouldbechanged',
        { expiresIn: '30d' }
      );

      return res.status(201).json({ ...orderObj, orderAccessToken });
    }
  } catch (dbErr) {
    console.warn('DB Order Save error, falling back to instant confirmation:', dbErr.message);
  }

  // Resilient fallback order response
  const fallbackOrder = {
    _id: orderId,
    items: formattedItems,
    shippingAddress: shippingAddress || { street: '2a De Fonseka Rd', city: 'Colombo', state: 'Western', zip: '00500', country: 'Sri Lanka' },
    paymentMethod: paymentMethod || 'COD',
    paymentStatus: 'Pending',
    transferReceipt: transferReceipt || null,
    orderStatus: 'Confirmed',
    itemsPrice: 0,
    shippingPrice: 0,
    discountAmount: 0,
    total: 0,
    guestEmail: guestEmail || (req.user && req.user.email) || '',
    guestName: guestName || (req.user && req.user.name) || '',
    guestPhone: guestPhone || '',
    user: userId,
    createdAt: new Date(),
  };

  const orderAccessToken = jwt.sign(
    { orderId, email: fallbackOrder.guestEmail, type: 'order_access' },
    process.env.JWT_SECRET || 'supersecretjwtkeythatshouldbechanged',
    { expiresIn: '30d' }
  );

  inMemoryOrders.unshift(fallbackOrder);
  triggerOrderNotifications(fallbackOrder);
  res.status(201).json({ ...fallbackOrder, orderAccessToken });
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const userEmail = req.user ? (req.user.email || '').toLowerCase().trim() : '';

    let orders = [];
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState === 1 && userId) {
      try {
        const query = userEmail
          ? { $or: [{ user: userId }, { guestEmail: { $regex: new RegExp(`^${userEmail}$`, 'i') } }] }
          : { user: userId };
        orders = await Order.find(query).sort({ createdAt: -1 });
      } catch (dbErr) {
        console.warn('DB fetch myorders warning:', dbErr.message);
      }
    }

    if (!orders || orders.length === 0) {
      orders = inMemoryOrders.filter((o) => {
        const matchesUser = userId && o.user && String(o.user) === String(userId);
        const matchesEmail = userEmail && o.guestEmail && o.guestEmail.toLowerCase().trim() === userEmail;
        return matchesUser || matchesEmail;
      });
    }

    // STRICT: Return only this user's orders, empty array if none
    res.json(orders || []);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch user orders' });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    let orders = [];
    if (mongoose.connection.readyState === 1) {
      try {
        orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'id name email');
      } catch (dbErr) {
        console.warn('DB fetch orders warning:', dbErr.message);
      }
    }

    if (!orders || orders.length === 0) {
      orders = inMemoryOrders;
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Protected (Admin, Order Owner, or Verified Guest Order Token)
export const getOrderById = async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    let order = null;
    if (mongoose.connection.readyState === 1) {
      try {
        order = await Order.findById(req.params.id).populate('user', 'name email');
      } catch (dbErr) {}
    }

    if (!order) {
      order = inMemoryOrders.find((o) => String(o._id) === String(req.params.id));
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify caller authorization
    const isAuthorized =
      (req.user && req.user.role === 'admin') ||
      (req.user && order.user && String(order.user._id || order.user) === String(req.user._id)) ||
      (req.user && order.guestEmail && req.user.email && order.guestEmail.toLowerCase() === req.user.email.toLowerCase()) ||
      (req.orderAccess && String(req.orderAccess.orderId) === String(order._id));

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error loading order' });
  }
};

// @desc    Download or View Order PDF Invoice
// @route   GET /api/orders/:id/invoice
// @access  Protected (Admin, Order Owner, or Verified Guest Order Token)
export const downloadOrderInvoice = async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    let order = null;
    const isDownload = req.query.download === 'true';

    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.isValidObjectId(req.params.id)) {
          order = await Order.findById(req.params.id).populate('user', 'name email phone');
        } else {
          order = await Order.findOne({ _id: req.params.id }).populate('user', 'name email phone');
        }
      } catch (dbErr) {
        console.warn('DB Invoice lookup error:', dbErr.message);
      }
    }

    if (!order) {
      order = inMemoryOrders.find((o) => String(o._id) === String(req.params.id));
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify caller authorization
    const isAuthorized =
      (req.user && req.user.role === 'admin') ||
      (req.user && order.user && String(order.user._id || order.user) === String(req.user._id)) ||
      (req.user && order.guestEmail && req.user.email && order.guestEmail.toLowerCase() === req.user.email.toLowerCase()) ||
      (req.orderAccess && String(req.orderAccess.orderId) === String(order._id));

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    const { generateInvoicePDF } = await import('../utils/pdfInvoiceGenerator.js');
    generateInvoicePDF(order, res, isDownload);
  } catch (error) {
    console.error('Invoice error:', error);
    res.status(500).json({ message: 'Failed to generate PDF invoice' });
  }
};


