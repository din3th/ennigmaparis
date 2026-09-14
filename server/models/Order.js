import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.Mixed, required: false },
    guestEmail: { type: String, required: false },
    guestName: { type: String, required: false },
    guestPhone: { type: String, required: false },
    items: [
      {
        product: { type: mongoose.Schema.Types.Mixed, required: false },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        size: { type: String },
        price: { type: Number, required: true },
      }
    ],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true, default: 'Pending' },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
      paymentGateway: String,
    },
    orderStatus: { type: String, required: true, default: 'Pending', enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] },
    itemsPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    discountCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
