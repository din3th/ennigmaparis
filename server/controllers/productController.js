import Product from '../models/Product.js';
import Category from '../models/Category.js';
import BackInStock from '../models/BackInStock.js';

// @desc    Fetch all products with filtering & search
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { category, subcategory, search, sort, minPrice, maxPrice, featured } = req.query;

    let query = {};

    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    if (subcategory) {
      query.subcategory = { $regex: new RegExp(`^${subcategory}$`, 'i') };
    }
    if (featured === 'true') {
      query.isFeatured = true;
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

    const products = await Product.find(query).sort(sortOptions);
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
    const isObjectId = req.params.slug.match(/^[0-9a-fA-F]{24}$/);
    const product = isObjectId 
      ? await Product.findById(req.params.slug)
      : await Product.findOne({ slug: req.params.slug });

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
