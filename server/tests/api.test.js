import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../models/Category.js', () => ({
  default: {
    find: vi.fn().mockResolvedValue([]),
  },
}));

import productRoutes from '../routes/productRoutes.js';
import paymentRoutes from '../routes/paymentRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);

describe('Ennigma API Endpoints', () => {
  it('GET /api/products/categories/tree should return default category tree', async () => {
    const res = await request(app).get('/api/products/categories/tree');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/payments/cod/confirm should confirm cash on delivery', async () => {
    const res = await request(app)
      .post('/api/payments/cod/confirm')
      .send({ orderId: 'test_order_123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.paymentMethod).toBe('COD');
  });

  it('POST /api/payments/stripe/create-intent should generate mock intent when no key configured', async () => {
    const res = await request(app)
      .post('/api/payments/stripe/create-intent')
      .send({ amount: 150 });

    expect(res.status).toBe(200);
    expect(res.body.clientSecret).toBeDefined();
  });
});

