import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    images: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number },
    category: { type: String, required: true },
    subcategory: { type: String },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    variants: [
      {
        size: String,
        color: String,
        stock: Number,
        sku: String,
      }
    ],
    stock: { type: Number, required: true, default: 0, min: 0 },
    sold: { type: Boolean, default: false },
    brand: { type: String },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    collectionName: { type: String },
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true }
);

productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
