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

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error loading order' });
  }
};

// @desc    Download Order PDF Invoice
// @route   GET /api/orders/:id/invoice
// @access  Public
export const downloadOrderInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { generateInvoicePDF } = await import('../utils/pdfInvoiceGenerator.js');
    generateInvoicePDF(order, res);
  } catch (error) {
    console.error('Invoice error:', error);
    res.status(500).json({ message: 'Failed to generate PDF invoice' });
  }
};

