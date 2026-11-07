import mongoose from 'mongoose';

export const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
export const PAYMENT_STATUSES = ['Pending', 'Completed', 'Failed', 'Refunded'];

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestEmail: { type: String, lowercase: true, trim: true },
    guestName: { type: String, trim: true },
    guestPhone: { type: String, trim: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        size: { type: String },
        price: { type: Number, required: true, min: 0 },
        image: { type: String },
      },
    ],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true, enum: ['Bank Transfer', 'COD', 'Stripe', 'PayHere'] },
    paymentStatus: { type: String, required: true, default: 'Pending', enum: PAYMENT_STATUSES },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
      paymentGateway: String,
    },
    transferReceipt: {
      url: String,
      filename: String,
      originalName: String,
      fileType: String,
      size: Number,
      uploadedAt: { type: Date },
    },
    orderStatus: { type: String, required: true, default: 'Pending', enum: ORDER_STATUSES },
    statusHistory: [
      {
        orderStatus: String,
        paymentStatus: String,
        note: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
    stockRestored: { type: Boolean, default: false },
    trackingNumber: { type: String },
    carrier: { type: String, default: 'PromptX Courier Express' },
    trackingUrl: { type: String },
    dispatchNote: { type: String },
    currency: { type: String, default: 'LKR' },
    itemsPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    discountCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ guestEmail: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
