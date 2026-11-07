import { z } from 'zod';
import mongoose from 'mongoose';
import { HttpError } from './errorHandler.js';

/** Validates and replaces req.body with the parsed (coerced, stripped) value. */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return next(new HttpError(400, details[0]?.message || 'Invalid request body', details));
  }
  req.body = result.data;
  next();
};

export const objectId = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v), { message: 'Invalid id' });

export const email = z.string().trim().toLowerCase().email('A valid email is required').max(254);
export const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const shortText = (max = 200) => z.string().trim().max(max);

export const schemas = {
  register: z.object({
    name: shortText(100).min(1, 'Name is required'),
    email,
    password,
    phone: shortText(30).optional(),
  }),

  login: z.object({
    email,
    password: z.string().min(1, 'Password is required').max(128),
  }),

  updateProfile: z.object({
    name: shortText(100).min(1).optional(),
    email: email.optional(),
    phone: shortText(30).optional(),
    password: password.optional(),
    address: z
      .object({
        street: shortText().optional(),
        city: shortText(100).optional(),
        state: shortText(100).optional(),
        zip: shortText(20).optional(),
        country: shortText(100).optional(),
      })
      .nullable()
      .optional(),
  }),

  createOrder: z
    .object({
      orderItems: z
        .array(
          z.object({
            product: objectId,
            qty: z.coerce.number().int().min(1).max(20),
            size: shortText(30).optional(),
          })
        )
        .min(1, 'No order items provided')
        .max(50),
      shippingAddress: z.object({
        street: shortText().min(1, 'Street is required'),
        city: shortText(100).min(1, 'City is required'),
        state: shortText(100).min(1, 'State is required'),
        zip: shortText(20).min(1, 'Postal code is required'),
        country: shortText(100).min(1, 'Country is required'),
      }),
      paymentMethod: z.enum(['Bank Transfer', 'COD', 'Stripe', 'PayHere']),
      discountCode: shortText(50).optional(),
      guestEmail: email.optional().or(z.literal('')),
      guestName: shortText(100).optional(),
      guestPhone: shortText(30).optional(),
      transferReceipt: z
        .object({
          url: z
            .string()
            .max(500)
            .regex(
              /^(\/uploads\/[A-Za-z0-9._-]+|https:\/\/res\.cloudinary\.com\/[^\s"'<>]+)$/,
              'Receipt must be uploaded through the receipt upload endpoint'
            ),
          filename: shortText(255).optional(),
          originalName: shortText(255).optional(),
          fileType: shortText(100).optional(),
          size: z.coerce.number().nonnegative().optional(),
        })
        .nullable()
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (data.paymentMethod === 'Bank Transfer' && !data.transferReceipt) {
        ctx.addIssue({ code: 'custom', path: ['transferReceipt'], message: 'A bank transfer slip is required' });
      }
    }),

  orderStatus: z.object({
    orderStatus: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']).optional(),
    paymentStatus: z.enum(['Pending', 'Completed', 'Failed', 'Refunded']).optional(),
    trackingNumber: shortText(100).optional(),
    carrier: shortText(100).optional(),
    trackingUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
    dispatchNote: shortText(1000).optional(),
  }),

  orderIdBody: z.object({ orderId: objectId }),

  product: z.object({
    name: shortText(200).min(1, 'Name is required'),
    slug: shortText(200).optional(),
    description: z.string().trim().max(10000).default(''),
    price: z.coerce.number().positive('Price must be positive'),
    salePrice: z.coerce.number().nonnegative().nullable().optional().or(z.literal('').transform(() => null)),
    images: z.array(z.string().max(1000)).max(20).optional(),
    category: shortText(100).optional(),
    subcategory: shortText(100).optional(),
    sizes: z.union([z.array(shortText(30)), z.string().max(500)]).optional(),
    colors: z.array(shortText(50)).max(50).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    brand: shortText(100).optional(),
    isFeatured: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    collectionName: shortText(100).optional(),
  }),

  review: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().min(1, 'Comment is required').max(2000),
  }),

  backInStock: z.object({
    email,
    variantInfo: shortText(100).optional(),
  }),

  newsletter: z.object({ email }),

  discount: z.object({
    code: shortText(50).min(1),
    discountType: z.enum(['percentage', 'fixed']),
    value: z.coerce.number().positive(),
    minSpend: z.coerce.number().nonnegative().optional(),
    expiryDate: z.coerce.date().optional().nullable(),
    usageLimit: z.coerce.number().int().positive().optional().nullable(),
  }),

  validateDiscount: z.object({
    code: shortText(50).min(1, 'Discount code is required'),
    cartTotal: z.coerce.number().nonnegative().default(0),
  }),

  role: z.object({ role: z.enum(['customer', 'admin']) }),
};
