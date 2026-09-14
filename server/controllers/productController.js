import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import BackInStock from '../models/BackInStock.js';

const getFallbackProducts = () => {
  try {
    const calmEditPath = path.join(process.cwd(), 'data/calm_edit_products.json');
    if (fs.existsSync(calmEditPath)) {
      const data = fs.readFileSync(calmEditPath, 'utf8');
      return JSON.parse(data).map((p, idx) => ({
        _id: p._id || `fallback_${idx}`,
        ...p
      }));
    }
    const clientPath = path.join(process.cwd(), '../client/src/data/products.json');
    if (fs.existsSync(clientPath)) {
      const data = fs.readFileSync(clientPath, 'utf8');
      const items = JSON.parse(data);
      return items.map((p, idx) => ({
        _id: `fallback_${idx}`,
        name: p.title,
        slug: p.handle,
        description: p.description || 'Designed in Paris.',
        images: p.images,
        price: parseFloat(p.price) || 4500,
        category: 'Women',
        subcategory: 'Dresses & Evening Gowns',
        sizes: p.sizes || ['8', '10', '12'],
        stock: 10,
        brand: 'ENNIGMA PARIS',
        isFeatured: true,
        isNewArrival: true,
        collectionName: 'The Calm Edit',
        rating: 4.8,
        numReviews: 4,
      }));
    }
  } catch (e) {
    console.error('Fallback read error:', e);
  }
  return [];
};

// @desc    Fetch all products with filtering & search
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { category, subcategory, search, sort, minPrice, maxPrice, featured, color, size, inStock } = req.query;

    let query = {};

    if (category) {
      query.category = { $regex: new RegExp(category, 'i') };
    }
    if (subcategory) {
      // Escape regex special chars if necessary and match loosely
      const cleanSub = subcategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { subcategory: { $regex: new RegExp(cleanSub, 'i') } },
        { category: { $regex: new RegExp(cleanSub, 'i') } },
        { collectionName: { $regex: new RegExp(cleanSub, 'i') } },
        { name: { $regex: new RegExp(cleanSub, 'i') } },
      ];
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }
    if (color) {
      query.colors = { $in: [new RegExp(color, 'i')] };
    }
    if (size) {
      query.sizes = { $in: [new RegExp(size, 'i')] };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price-low') sortOptions = { price: 1 };
    if (sort === 'price-high') sortOptions = { price: -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };
    if (sort === 'popular') sortOptions = { numReviews: -1 };

    let products = [];
    if (mongoose.connection.readyState === 1) {
      try {
        products = await Product.find(query).sort(sortOptions);
      } catch (dbErr) {
        console.warn('MongoDB query warning (using fallback dataset):', dbErr.message);
      }
    }


    if (!products || products.length === 0) {
      let fallback = getFallbackProducts();

      if (category) {
        fallback = fallback.filter(p => p.category?.toLowerCase().includes(category.toLowerCase()));
      }
      if (subcategory) {
        const subClean = subcategory.toLowerCase();
        fallback = fallback.filter(p => 
          p.subcategory?.toLowerCase().includes(subClean) ||
          p.category?.toLowerCase().includes(subClean) ||
          subClean.includes((p.subcategory || '').toLowerCase()) ||
          p.collectionName?.toLowerCase().includes(subClean) ||
          p.name?.toLowerCase().includes(subClean)
        );
      }
      if (search) {
        const s = search.toLowerCase();
        fallback = fallback.filter(p =>
          p.name?.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s) ||
          p.category?.toLowerCase().includes(s)
        );
      }
      if (minPrice) fallback = fallback.filter(p => p.price >= Number(minPrice));
      if (maxPrice) fallback = fallback.filter(p => p.price <= Number(maxPrice));
      if (inStock === 'true') fallback = fallback.filter(p => (p.stock || 0) > 0);

      if (sort === 'price-low') fallback.sort((a, b) => a.price - b.price);
      else if (sort === 'price-high') fallback.sort((a, b) => b.price - a.price);
      else if (sort === 'rating') fallback.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      products = fallback;
    }

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single product by slug or id
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (req, res) => {
  try {
    let product = null;
    try {
      const isObjectId = req.params.slug.match(/^[0-9a-fA-F]{24}$/);
      product = isObjectId 
        ? await Product.findById(req.params.slug)
        : await Product.findOne({ slug: req.params.slug });
    } catch (dbErr) {
      console.warn('DB lookup warning:', dbErr.message);
    }

    if (!product) {
      const fallbackList = getFallbackProducts();
      product = fallbackList.find(
        (p) => p.slug === req.params.slug || p._id === req.params.slug
      );
    }

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const slug = req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const product = new Product({
      name: req.body.name,
      slug,
      description: req.body.description,
      price: req.body.price,
      salePrice: req.body.salePrice,
      images: req.body.images || [],
      category: req.body.category,
      subcategory: req.body.subcategory,
      sizes: req.body.sizes || [],
      colors: req.body.colors || [],
      variants: req.body.variants || [],
      stock: req.body.stock || 0,
      brand: req.body.brand || 'ENNIGMA PARIS',
      isFeatured: req.body.isFeatured || false,
      isNewArrival: req.body.isNewArrival || false,
      collectionName: req.body.collectionName,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'A product with this name/slug already exists.' });
    } else {
      res.status(500).json({ message: 'Server error while creating product' });
    }
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.stock;

    product.name = req.body.name || product.name;
    product.price = req.body.price !== undefined ? req.body.price : product.price;
    product.salePrice = req.body.salePrice !== undefined ? req.body.salePrice : product.salePrice;
    product.description = req.body.description || product.description;
    product.category = req.body.category || product.category;
    product.subcategory = req.body.subcategory || product.subcategory;
    product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;
    product.images = req.body.images || product.images;
    product.isFeatured = req.body.isFeatured !== undefined ? req.body.isFeatured : product.isFeatured;
    product.isNewArrival = req.body.isNewArrival !== undefined ? req.body.isNewArrival : product.isNewArrival;

    const updatedProduct = await product.save();

    // Trigger back in stock notifications if stock went from 0 to > 0
    if (previousStock <= 0 && updatedProduct.stock > 0) {
      const pendingRequests = await BackInStock.find({ product: updatedProduct._id, notified: false });
      if (pendingRequests.length > 0) {
        const { sendBackInStockEmail } = await import('../utils/emailService.js');
        for (const reqObj of pendingRequests) {
          await sendBackInStockEmail(reqObj.email, updatedProduct);
          reqObj.notified = true;
          await reqObj.save();
        }
      }
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
};

// @desc    Create new product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ message: 'Server error adding review' });
  }
};

// @desc    Register back in stock notification
// @route   POST /api/products/:id/notify
// @access  Public
export const requestBackInStock = async (req, res) => {
  const { email, variantInfo } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const request = new BackInStock({
      product: req.params.id,
      email,
      variantInfo: variantInfo || 'General',
    });

    await request.save();
    res.status(201).json({ message: 'Notification request received. We will email you when back in stock!' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting notification request' });
  }
};

// @desc    Get category tree (Nested parent/children categories)
// @route   GET /api/products/categories/tree
// @access  Public
export const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({});
    
    // Default fallback categories if database table is empty
    if (categories.length === 0) {
      const defaultTree = [
        {
          name: 'Women',
          slug: 'women',
          subcategories: ['Tops & Shirts', 'Dresses & Skirts', 'Jackets & Coats', 'Trousers & Jeans', 'Accessories'],
        },
        {
          name: 'Men',
          slug: 'men',
          subcategories: ['Shirts & Polo', 'Suits & Blazers', 'Outerwear', 'Pants & Denim', 'Leather Goods'],
        },
        {
          name: 'Accessories',
          slug: 'accessories',
          subcategories: ['Handbags', 'Footwear', 'Jewelry', 'Sunglasses', 'Perfume'],
        },
      ];
      return res.json(defaultTree);
    }

    const parentCategories = categories.filter((c) => !c.parent);
    const tree = parentCategories.map((parent) => ({
      ...parent.toObject(),
      subcategories: categories.filter((c) => c.parent && c.parent.toString() === parent._id.toString()),
    }));

    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category tree' });
  }
};
