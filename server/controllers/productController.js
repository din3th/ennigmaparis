import Product from '../models/Product.js';
import Category from '../models/Category.js';
import BackInStock from '../models/BackInStock.js';
import { HttpError } from '../middleware/errorHandler.js';

const escapeRegex = (s) => String(s || '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
const ci = (s) => new RegExp(escapeRegex(s), 'i');

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const normalizeSizes = (sizes) => {
  if (Array.isArray(sizes)) return sizes.map((s) => String(s).trim()).filter(Boolean);
  if (typeof sizes === 'string') return sizes.split(',').map((s) => s.trim()).filter(Boolean);
  return undefined;
};

/** Finds a slug that is not yet used by another product. */
const uniqueSlug = async (base, excludeId) => {
  const root = slugify(base) || 'product';
  let slug = root;
  for (let i = 2; await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }); i++) {
    slug = `${root}-${i}`;
  }
  return slug;
};

// @desc    Fetch all products with filtering & search
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  const { category, subcategory, search, sort, minPrice, maxPrice, featured, color, size, inStock } = req.query;
  const query = {};

  if (category) query.category = ci(category);
  if (subcategory) {
    const re = ci(subcategory);
    query.$or = [{ subcategory: re }, { category: re }, { collectionName: re }, { name: re }];
  }
  if (featured === 'true') query.isFeatured = true;
  if (inStock === 'true') query.stock = { $gt: 0 };
  if (color) query.colors = { $in: [ci(color)] };
  if (size) query.sizes = { $in: [ci(size)] };
  if (search) {
    const re = ci(search);
    const searchOr = [{ name: re }, { description: re }, { category: re }, { subcategory: re }];
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: searchOr }];
      delete query.$or;
    } else {
      query.$or = searchOr;
    }
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice && !Number.isNaN(Number(minPrice))) query.price.$gte = Number(minPrice);
    if (maxPrice && !Number.isNaN(Number(maxPrice))) query.price.$lte = Number(maxPrice);
  }

  const sortOptions = {
    'price-low': { price: 1 },
    'price-high': { price: -1 },
    rating: { rating: -1 },
    popular: { numReviews: -1 },
  }[sort] || { createdAt: -1 };

  const products = await Product.find(query).select('-reviews').sort(sortOptions).limit(500);
  res.json(products);
};

// @desc    Fetch single product by slug or id
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (req, res) => {
  const { slug } = req.params;
  const product = /^[0-9a-fA-F]{24}$/.test(slug)
    ? await Product.findById(slug)
    : await Product.findOne({ slug });
  if (!product) throw new HttpError(404, 'Product not found');
  res.json(product);
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  const body = req.body;
  const sizes = normalizeSizes(body.sizes);

  const product = await Product.create({
    name: body.name,
    slug: await uniqueSlug(body.slug || body.name),
    description: body.description || '',
    price: body.price,
    salePrice: body.salePrice || null,
    images: body.images?.length ? body.images : [],
    category: body.category || 'Women',
    subcategory: body.subcategory || '',
    sizes: sizes?.length ? sizes : ['UK 6', 'UK 8', 'UK 10', 'UK 12'],
    colors: body.colors || [],
    stock: body.stock ?? 0,
    brand: body.brand || 'ENNIGMA PARIS',
    isFeatured: body.isFeatured ?? true,
    isNewArrival: body.isNewArrival ?? true,
    collectionName: body.collectionName || '',
  });

  res.status(201).json(product);
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');

  const { name, price, salePrice, description, images, category, subcategory, sizes, stock, isFeatured, isNewArrival, colors, brand, collectionName } = req.body;

  if (name && name !== product.name) {
    product.name = name;
    product.slug = await uniqueSlug(name, product._id);
  }
  if (price !== undefined) product.price = price;
  if (salePrice !== undefined) product.salePrice = salePrice || null;
  if (description !== undefined) product.description = description;
  if (images?.length) product.images = images;
  if (category) product.category = category;
  if (subcategory !== undefined) product.subcategory = subcategory;
  const normalized = normalizeSizes(sizes);
  if (normalized !== undefined) product.sizes = normalized;
  if (stock !== undefined) product.stock = stock;
  if (isFeatured !== undefined) product.isFeatured = isFeatured;
  if (isNewArrival !== undefined) product.isNewArrival = isNewArrival;
  if (colors !== undefined) product.colors = colors;
  if (brand !== undefined) product.brand = brand;
  if (collectionName !== undefined) product.collectionName = collectionName;

  res.json(await product.save());
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ message: 'Product removed' });
};

// @desc    Create new product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');

  if (product.reviews.some((r) => String(r.user) === String(req.user._id))) {
    throw new HttpError(400, 'You have already reviewed this product');
  }

  product.reviews.push({ name: req.user.name, rating, comment, user: req.user._id });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

  await product.save();
  res.status(201).json({ message: 'Review added successfully' });
};

// @desc    Register back in stock notification
// @route   POST /api/products/:id/notify
// @access  Public
export const requestBackInStock = async (req, res) => {
  if (!(await Product.exists({ _id: req.params.id }))) {
    throw new HttpError(404, 'Product not found');
  }
  const { email, variantInfo } = req.body;
  await BackInStock.updateOne(
    { product: req.params.id, email, variantInfo: variantInfo || 'General', notified: false },
    { $setOnInsert: { product: req.params.id, email, variantInfo: variantInfo || 'General' } },
    { upsert: true }
  );
  res.status(201).json({ message: 'Notification request received. We will email you when back in stock!' });
};

const DEFAULT_CATEGORY_TREE = [
  { name: 'Women', slug: 'women', subcategories: ['Tops & Shirts', 'Dresses & Skirts', 'Jackets & Coats', 'Trousers & Jeans', 'Accessories'] },
  { name: 'Men', slug: 'men', subcategories: ['Shirts & Polo', 'Suits & Blazers', 'Outerwear', 'Pants & Denim', 'Leather Goods'] },
  { name: 'Accessories', slug: 'accessories', subcategories: ['Handbags', 'Footwear', 'Jewelry', 'Sunglasses', 'Perfume'] },
];

// @desc    Get category tree (nested parent/children categories)
// @route   GET /api/products/categories/tree
// @access  Public
export const getCategoryTree = async (req, res) => {
  const categories = await Category.find({});
  if (categories.length === 0) return res.json(DEFAULT_CATEGORY_TREE);

  const tree = categories
    .filter((c) => !c.parent)
    .map((parent) => ({
      ...parent.toObject(),
      subcategories: categories.filter((c) => c.parent && String(c.parent) === String(parent._id)),
    }));
  res.json(tree);
};
