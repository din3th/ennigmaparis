import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js';
import Category from './models/Category.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ennigma';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Read scraped calm edit products
    const calmEditPath = path.join(__dirname, './data/calm_edit_products.json');
    let productsToInsert = [];

    if (fs.existsSync(calmEditPath)) {
      const rawCalm = fs.readFileSync(calmEditPath, 'utf8');
      productsToInsert = JSON.parse(rawCalm);
    } else {
      const productsPath = path.join(__dirname, '../client/src/data/products.json');
      const rawData = fs.readFileSync(productsPath, 'utf8');
      const productsData = JSON.parse(rawData);
      productsToInsert = productsData.map(p => ({
        name: p.title,
        slug: p.handle,
        description: p.description || 'No description available.',
        images: p.images,
        price: parseFloat(p.price) || 0,
        salePrice: p.compare_at_price ? parseFloat(p.compare_at_price) : null,
        category: 'Dresses',
        sizes: p.sizes,
        stock: 10,
        brand: 'ENNIGMA PARIS',
        isFeatured: true,
        isNewArrival: true,
        collectionName: 'The Calm Edit'
      }));
    }

    await Product.insertMany(productsToInsert);
    console.log(`Database seeded successfully with ${productsToInsert.length} products!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
