import crypto from 'crypto';

// @desc    Create Stripe Payment Intent (or mock fallback if no secret key)
// @route   POST /api/payments/stripe/create-intent
// @access  Public
export const createStripeIntent = async (req, res) => {
  const { amount, currency = 'usd', orderId } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Amount is required' });
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (stripeSecretKey && stripeSecretKey.startsWith('sk_live_')) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecretKey);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata: { orderId: orderId || '' },
      });

      return res.json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        isMock: false,
      });
    }

    // Mock response for development / demo mode
    const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`;
    res.json({
      clientSecret: mockClientSecret,
      id: `pi_mock_${Date.now()}`,
      isMock: true,
      message: 'Demo Mode: Mock Stripe Payment Intent generated successfully',
    });
  } catch (error) {
    console.error('Stripe Intent Error (falling back to mock):', error.message);
    const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`;
    res.json({
      clientSecret: mockClientSecret,
      id: `pi_mock_${Date.now()}`,
      isMock: true,
      message: 'Demo Mode: Mock Stripe Payment Intent generated successfully',
    });
  }
};

// @desc    Generate PayHere Checkout Hash and Metadata
// @route   POST /api/payments/payhere/hash
// @access  Public
export const generatePayHereHash = async (req, res) => {
  const { orderId, amount, currency = 'USD' } = req.body;

  const merchantId = process.env.PAYHERE_MERCHANT_ID || '1223456';
  const merchantSecret = process.env.PAYHERE_SECRET || '4XX12345678901234567890';

  const formattedAmount = Number(amount).toLocaleString('en-us', { minimumFractionDigits: 2 }).replaceAll(',', '');

  // Hash calculation: UPPERCASE(MD5(merchant_id + order_id + amount + currency + UPPERCASE(MD5(merchant_secret))))
  const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const hashString = merchantId + orderId + formattedAmount + currency + hashedSecret;
  const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

  res.json({
    merchant_id: merchantId,
    order_id: orderId,
    amount: formattedAmount,
    currency,
    hash,
    sandbox: process.env.NODE_ENV !== 'production',
  });
};

// @desc    Confirm Cash on Delivery Order
// @route   POST /api/payments/cod/confirm
// @access  Public
export const confirmCodOrder = async (req, res) => {
  const { orderId } = req.body;

  res.json({
    success: true,
    orderId,
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    message: 'Cash on Delivery order placed successfully! Payment will be collected upon delivery.',
  });
};

// @desc    Handle Stripe Webhook Events
// @route   POST /api/payments/webhook
// @access  Public
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || !webhookSecret) {
      return res.status(200).json({ received: true, mode: 'mock/unconfigured' });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        const Order = (await import('../models/Order.js')).default;
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'Completed',
          orderStatus: 'Processing',
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};


