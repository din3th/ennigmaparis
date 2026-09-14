import mongoose from 'mongoose';

const discountCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, required: true, enum: ['percentage', 'fixed'] },
    value: { type: Number, required: true },
    minSpend: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const DiscountCode = mongoose.model('DiscountCode', discountCodeSchema);
export default DiscountCode;
