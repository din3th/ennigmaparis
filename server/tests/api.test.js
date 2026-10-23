import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../models/Category.js', () => ({
  default: {
    find: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../middleware/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_admin_1', role: 'admin' };
    next();
  },
  admin: (req, res, next) => next(),
}));

import productRoutes from '../routes/productRoutes.js';
import paymentRoutes from '../routes/paymentRoutes.js';
import uploadRoutes from '../routes/uploadRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);

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

  it('GET /api/upload/config should return storage configuration and CDN status', async () => {
    const res = await request(app).get('/api/upload/config');
    expect(res.status).toBe(200);
    expect(res.body.storageMode).toBeDefined();
    expect(typeof res.body.cloudinaryEnabled).toBe('boolean');
  });

  it('POST /api/products should preserve custom sizes array added by admin', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({
        name: 'Atelier Silk Gown',
        price: 9500,
        description: 'Silk luxury gown',
        category: 'Women',
        sizes: ['UK 8', 'UK 10', 'UK 12', 'UK 14', 'One Size'],
      });

    expect(res.status).toBe(201);
    expect(res.body.sizes).toEqual(['UK 8', 'UK 10', 'UK 12', 'UK 14', 'One Size']);
  });
});

