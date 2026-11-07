import crypto from 'crypto';
import Order from '../models/Order.js';
import { canAccessOrder } from '../middleware/authMiddleware.js';
import { HttpError } from '../middleware/errorHandler.js';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

const md5Upper = (s) => crypto.createHash('md5').update(s).digest('hex').toUpperCase();
const formatAmount = (n) => Number(n).toFixed(2);
const safeEqual = (a, b) => {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

let stripeClient = null;
const getStripe = async () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, 'Card payments are not available right now');
  }
  if (!stripeClient) {
    const Stripe = (await import('stripe')).default;
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

const getPayHereCredentials = () => {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_SECRET;
  if (!merchantId || !merchantSecret) {
    throw new HttpError(503, 'PayHere payments are not available right now');
  }
  return { merchantId, merchantSecret };
};

/** Loads an unpaid order the caller is allowed to pay for. */
const loadPayableOrder = async (req, method) => {
  const order = await Order.findById(req.body.orderId);
  if (!order || !canAccessOrder(req, order)) throw new HttpError(404, 'Order not found');
  if (order.paymentMethod !== method) throw new HttpError(400, `This order is not set up for ${method} payment`);
  if (order.paymentStatus === 'Completed') throw new HttpError(400, 'This order has already been paid');
  if (order.orderStatus === 'Cancelled') throw new HttpError(400, 'This order was cancelled');
  return order;
};

const markOrderPaid = async (orderId, { amount, currency, gateway, reference }) => {
  const order = await Order.findById(orderId);
  if (!order) {
    logger.warn('Payment received for unknown order', { orderId, gateway });
    return;
  }
  if (order.paymentStatus === 'Completed') return; // idempotent: gateways retry

  const expected = formatAmount(order.total);
  if (formatAmount(amount) !== expected || String(currency).toUpperCase() !== String(order.currency).toUpperCase()) {
    logger.error('Payment amount mismatch, not marking order paid', {
      orderId, gateway, received: `${amount} ${currency}`, expected: `${expected} ${order.currency}`,
    });
    return;
  }

  order.paymentStatus = 'Completed';
  if (order.orderStatus === 'Pending') order.orderStatus = 'Processing';
  order.paymentResult = { id: reference, status: 'Completed', update_time: new Date().toISOString(), paymentGateway: gateway };
  order.statusHistory.push({ orderStatus: order.orderStatus, paymentStatus: 'Completed', note: `Paid via ${gateway}` });
  await order.save();
};

// @desc    Create a Stripe Checkout session for an existing order
// @route   POST /api/payments/stripe/checkout-session
// @access  Order owner / guest browser that placed the order
export const createStripeCheckoutSession = async (req, res) => {
  const order = await loadPayableOrder(req, 'Stripe');
  const stripe = await getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: order.guestEmail || undefined,
    client_reference_id: String(order._id),
    metadata: { orderId: String(order._id) },
    payment_intent_data: { metadata: { orderId: String(order._id) } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: order.currency.toLowerCase(),
          unit_amount: Math.round(order.total * 100),
          product_data: { name: `ENNIGMA order ${order._id}` },
        },
      },
    ],
    success_url: `${config.frontendUrl}/order/${order._id}?payment=success`,
    cancel_url: `${config.frontendUrl}/order/${order._id}?payment=cancelled`,
  });

  res.json({ url: session.url });
};

// @desc    Stripe webhook: the only place a card payment is marked as paid
// @route   POST /api/payments/webhook
// @access  Stripe (signature verified)
export const handleStripeWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(503).json({ message: 'Stripe webhook is not configured' });
  }
  const stripe = await getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], webhookSecret);
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', { err: err.message });
    return res.status(400).json({ message: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
    const session = event.data.object;
    await markOrderPaid(session.metadata?.orderId || session.client_reference_id, {
      amount: session.amount_total / 100,
      currency: session.currency,
      gateway: 'Stripe',
      reference: session.payment_intent || session.id,
    });
  }

  res.json({ received: true });
};

// @desc    Build the signed PayHere checkout form for an existing order
// @route   POST /api/payments/payhere/checkout
// @access  Order owner / guest browser that placed the order
export const createPayHereCheckout = async (req, res) => {
  const order = await loadPayableOrder(req, 'PayHere');
  const { merchantId, merchantSecret } = getPayHereCredentials();

  const amount = formatAmount(order.total);
  const currency = order.currency;
  const hash = md5Upper(merchantId + String(order._id) + amount + currency + md5Upper(merchantSecret));
  const [firstName, ...rest] = (order.guestName || 'Customer').split(' ');
  const apiBase = (process.env.API_PUBLIC_URL || config.frontendUrl).replace(/\/$/, '');

  res.json({
    action: process.env.PAYHERE_SANDBOX === 'true'
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout',
    fields: {
      merchant_id: merchantId,
      return_url: `${config.frontendUrl}/order/${order._id}?payment=success`,
      cancel_url: `${config.frontendUrl}/order/${order._id}?payment=cancelled`,
      notify_url: `${apiBase}/api/payments/payhere/notify`,
      order_id: String(order._id),
      items: `ENNIGMA order ${order._id}`,
      currency,
      amount,
      first_name: firstName,
      last_name: rest.join(' ') || '-',
      email: order.guestEmail || '',
      phone: order.guestPhone || '',
      address: order.shippingAddress.street,
      city: order.shippingAddress.city,
      country: order.shippingAddress.country,
      hash,
    },
  });
};

// @desc    PayHere server-to-server payment notification
// @route   POST /api/payments/payhere/notify
// @access  PayHere (md5sig verified)
export const handlePayHereNotify = async (req, res) => {
  const { merchantId, merchantSecret } = getPayHereCredentials();
  const {
    merchant_id: mId, order_id: orderId, payhere_amount: amount,
    payhere_currency: currency, status_code: statusCode, md5sig, payment_id: paymentId,
  } = req.body || {};

  const expected = md5Upper(String(mId) + orderId + amount + currency + statusCode + md5Upper(merchantSecret));
  if (mId !== merchantId || !md5sig || !safeEqual(expected, String(md5sig).toUpperCase())) {
    logger.warn('Rejected PayHere notification with invalid signature', { orderId });
    return res.status(400).send('Invalid signature');
  }

  if (String(statusCode) === '2') {
    await markOrderPaid(orderId, { amount, currency, gateway: 'PayHere', reference: paymentId });
  } else {
    logger.info('PayHere notification with non-success status', { orderId, statusCode });
  }
  res.send('OK');
};
