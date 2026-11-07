import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import crypto from 'crypto';
import request from 'supertest';
import { startApp, stopApp, resetDb, client, makeAdmin } from './helpers.js';

let app;
let Product;
let DiscountCode;
let Order;

beforeAll(async () => {
  app = await startApp();
  Product = (await import('../models/Product.js')).default;
  DiscountCode = (await import('../models/DiscountCode.js')).default;
  Order = (await import('../models/Order.js')).default;
});

afterAll(stopApp);
beforeEach(resetDb);

const address = { street: '1 Main St', city: 'Colombo', state: 'Western', zip: '00500', country: 'Sri Lanka' };

const createProduct = (overrides = {}) =>
  Product.create({ name: 'Silk Dress', slug: `silk-${crypto.randomUUID()}`, price: 100, stock: 5, category: 'Women', sizes: ['UK 8', 'UK 10'], ...overrides });

const orderBody = (product, overrides = {}) => ({
  orderItems: [{ product: String(product._id), qty: 1, size: 'UK 8' }],
  shippingAddress: address,
  paymentMethod: 'COD',
  guestEmail: 'guest@example.com',
  guestName: 'Guest Person',
  ...overrides,
});

describe('auth', () => {
  it('registers with an httpOnly session cookie and no token in the body', async () => {
    const c = client();
    const res = await c.post('/api/users/register').send({ name: 'Ann', email: 'Ann@Example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeUndefined();
    expect(res.body.email).toBe('ann@example.com');
    expect(res.headers['set-cookie'].join(';')).toMatch(/ennigma_session=.*HttpOnly/i);

    const profile = await c.get('/api/users/profile');
    expect(profile.status).toBe(200);
    expect(profile.body.email).toBe('ann@example.com');
  });

  it('rejects short passwords and bad credentials', async () => {
    const c = client();
    expect((await c.post('/api/users/register').send({ name: 'A', email: 'a@x.com', password: 'short' })).status).toBe(400);
    await c.post('/api/users/register').send({ name: 'A', email: 'a@x.com', password: 'password123' });
    expect((await client().post('/api/users/login').send({ email: 'a@x.com', password: 'wrongpass1' })).status).toBe(401);
  });

  it('updates the profile (previously crashed)', async () => {
    const c = client();
    await c.post('/api/users/register').send({ name: 'Ann', email: 'ann@x.com', password: 'password123' });
    const res = await c.put('/api/users/profile').send({ name: 'Annie', address });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Annie');
    expect(res.body.address.city).toBe('Colombo');
  });

  it('blocks state-changing requests without the CSRF header', async () => {
    const res = await request(app).post('/api/users/login').send({ email: 'a@x.com', password: 'x' });
    expect(res.status).toBe(403);
  });

  it('logout clears the session', async () => {
    const c = client();
    await c.post('/api/users/register').send({ name: 'Ann', email: 'ann@x.com', password: 'password123' });
    await c.post('/api/users/logout');
    expect((await c.get('/api/users/profile')).status).toBe(401);
  });
});

describe('order pricing and stock', () => {
  it('ignores client-supplied prices and shipping', async () => {
    const product = await createProduct({ price: 100, salePrice: 80 });
    const res = await client().post('/api/orders').send({
      ...orderBody(product),
      orderItems: [{ product: String(product._id), qty: 2, size: 'UK 8', price: 1 }],
      shippingPrice: -5000,
      totalPrice: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.itemsPrice).toBe(160);
    expect(res.body.shippingPrice).toBe(0); // over free-shipping threshold
    expect(res.body.total).toBe(160);
    expect(res.body.paymentStatus).toBe('Pending');
  });

  it('charges flat shipping under the threshold', async () => {
    const product = await createProduct({ price: 50 });
    const res = await client().post('/api/orders').send(orderBody(product));
    expect(res.body.shippingPrice).toBe(15);
    expect(res.body.total).toBe(65);
  });

  it('rejects unknown products', async () => {
    const res = await client().post('/api/orders').send({
      ...orderBody({ _id: '64b000000000000000000000' }),
    });
    expect(res.status).toBe(400);
  });

  it('decrements stock and refuses to oversell', async () => {
    const product = await createProduct({ stock: 1 });
    expect((await client().post('/api/orders').send(orderBody(product))).status).toBe(201);
    expect((await Product.findById(product._id)).stock).toBe(0);
    expect((await client().post('/api/orders').send(orderBody(product))).status).toBe(409);
  });

  it('rejects unavailable sizes', async () => {
    const product = await createProduct();
    const res = await client().post('/api/orders').send({
      ...orderBody(product),
      orderItems: [{ product: String(product._id), qty: 1, size: 'XXL' }],
    });
    expect(res.status).toBe(400);
  });

  it('requires a receipt for bank transfers and rejects data: URLs', async () => {
    const product = await createProduct();
    const missing = await client().post('/api/orders').send(orderBody(product, { paymentMethod: 'Bank Transfer' }));
    expect(missing.status).toBe(400);
    const dataUrl = await client().post('/api/orders').send(orderBody(product, {
      paymentMethod: 'Bank Transfer',
      transferReceipt: { url: 'data:image/png;base64,AAAA' },
    }));
    expect(dataUrl.status).toBe(400);
  });

  it('enforces discount usage limits and releases stock on failure', async () => {
    const product = await createProduct({ price: 200, stock: 10 });
    await DiscountCode.create({ code: 'ONCE', discountType: 'percentage', value: 10, usageLimit: 1 });

    const first = await client().post('/api/orders').send(orderBody(product, { discountCode: 'once' }));
    expect(first.status).toBe(201);
    expect(first.body.discountAmount).toBe(20);
    expect(first.body.total).toBe(180);

    const second = await client().post('/api/orders').send(orderBody(product, { discountCode: 'ONCE' }));
    expect(second.status).toBe(400);
    expect((await DiscountCode.findOne({ code: 'ONCE' })).usageCount).toBe(1);
    expect((await Product.findById(product._id)).stock).toBe(9);
  });

  it('restores stock when an admin cancels', async () => {
    const product = await createProduct({ stock: 3 });
    const order = (await client().post('/api/orders').send(orderBody(product))).body;

    const adminClient = client();
    await adminClient.post('/api/users/register').send({ name: 'Admin', email: 'admin@x.com', password: 'password123' });
    await makeAdmin('admin@x.com');
    const res = await adminClient.put(`/api/admin/orders/${order._id}/status`).send({ orderStatus: 'Cancelled' });
    expect(res.status).toBe(200);
    expect((await Product.findById(product._id)).stock).toBe(3);

    // Cancelling twice must not restock twice.
    await adminClient.put(`/api/admin/orders/${order._id}/status`).send({ orderStatus: 'Cancelled' });
    expect((await Product.findById(product._id)).stock).toBe(3);
  });
});

describe('order access', () => {
  it('lets only the placing browser, the owner or an admin see an order', async () => {
    const product = await createProduct();
    const guest = client();
    const order = (await guest.post('/api/orders').send(orderBody(product, { guestEmail: 'victim@example.com' }))).body;

    expect((await guest.get(`/api/orders/${order._id}`)).status).toBe(200);
    expect((await client().get(`/api/orders/${order._id}`)).status).toBe(404);

    // Registering with the victim's email must not reveal their guest orders.
    const attacker = client();
    await attacker.post('/api/users/register').send({ name: 'X', email: 'victim@example.com', password: 'password123' });
    expect((await attacker.get(`/api/orders/${order._id}`)).status).toBe(404);
    expect((await attacker.get('/api/orders/myorders')).body).toHaveLength(0);
  });

  it('lists a signed-in customer’s own orders', async () => {
    const product = await createProduct();
    const c = client();
    await c.post('/api/users/register').send({ name: 'Ann', email: 'ann@x.com', password: 'password123' });
    await c.post('/api/orders').send(orderBody(product, { guestEmail: '' }));
    const mine = await c.get('/api/orders/myorders');
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0].guestEmail).toBe('ann@x.com');
  });

  it('keeps admin endpoints admin-only', async () => {
    const c = client();
    await c.post('/api/users/register').send({ name: 'Ann', email: 'ann@x.com', password: 'password123' });
    expect((await c.get('/api/orders')).status).toBe(403);
    expect((await c.get('/api/admin/stats')).status).toBe(403);
  });
});

describe('payment callbacks', () => {
  const md5 = (s) => crypto.createHash('md5').update(s).digest('hex').toUpperCase();
  const payhereSig = (orderId, amount, currency, status) =>
    md5(process.env.PAYHERE_MERCHANT_ID + orderId + amount + currency + status + md5(process.env.PAYHERE_SECRET));

  const placePayHereOrder = async () => {
    const product = await createProduct({ price: 50 });
    const c = client();
    const order = (await c.post('/api/orders').send(orderBody(product, { paymentMethod: 'PayHere' }))).body;
    return { c, order };
  };

  it('builds a signed PayHere checkout for the order total', async () => {
    const { c, order } = await placePayHereOrder();
    const res = await c.post('/api/payments/payhere/checkout').send({ orderId: order._id });
    expect(res.status).toBe(200);
    expect(res.body.fields.amount).toBe('65.00');
    expect(res.body.fields.order_id).toBe(order._id);
  });

  it('marks an order paid only for a correctly signed, correctly priced notification', async () => {
    const { order } = await placePayHereOrder();
    const notify = (fields) => request(app).post('/api/payments/payhere/notify').type('form').send(fields);
    const base = { merchant_id: process.env.PAYHERE_MERCHANT_ID, order_id: order._id, payhere_currency: 'LKR', status_code: '2', payment_id: 'p1' };

    expect((await notify({ ...base, payhere_amount: '65.00', md5sig: 'BAD' })).status).toBe(400);
    await notify({ ...base, payhere_amount: '1.00', md5sig: payhereSig(order._id, '1.00', 'LKR', '2') });
    expect((await Order.findById(order._id)).paymentStatus).toBe('Pending');

    await notify({ ...base, payhere_amount: '65.00', md5sig: payhereSig(order._id, '65.00', 'LKR', '2') });
    const paid = await Order.findById(order._id);
    expect(paid.paymentStatus).toBe('Completed');
    expect(paid.orderStatus).toBe('Processing');
  });

  it('rejects Stripe webhooks with a bad signature', async () => {
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 't=1,v1=bad')
      .send({ type: 'checkout.session.completed' });
    expect(res.status).toBe(400);
  });
});

describe('uploads', () => {
  it('rejects SVG receipts even when disguised as PNG', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const res = await client().post('/api/upload/receipt').attach('receipt', svg, { filename: 'slip.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
  });

  it('accepts a real PDF receipt with a random filename', async () => {
    const pdf = Buffer.from('%PDF-1.4\n%test\n');
    const res = await client().post('/api/upload/receipt').attach('receipt', pdf, { filename: 'slip.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/^\/uploads\/receipt-[0-9a-f]{32}\.pdf$/);
  });

  it('requires admin for product image uploads', async () => {
    const res = await client().post('/api/upload').attach('images', Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'a.jpg');
    expect(res.status).toBe(401);
  });
});

describe('catalog', () => {
  it('returns the default category tree and real products', async () => {
    await createProduct({ name: 'Linen Shirt', category: 'Men' });
    const tree = await request(app).get('/api/products/categories/tree');
    expect(tree.status).toBe(200);
    expect(tree.body.length).toBeGreaterThan(0);

    const list = await request(app).get('/api/products?category=men');
    expect(list.body).toHaveLength(1);
    expect(list.body[0].name).toBe('Linen Shirt');
  });

  it('returns 404 for unknown products instead of fallback data', async () => {
    expect((await request(app).get('/api/products/does-not-exist')).status).toBe(404);
  });
});
