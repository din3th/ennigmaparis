import mongoose from 'mongoose';

const backInStockSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    variantInfo: { type: String },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BackInStock = mongoose.model('BackInStock', backInStockSchema);
export default BackInStock;
