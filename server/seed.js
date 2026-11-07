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

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Read scraped calm edit products
    const calmEditPath = path.join(__dirname, './data/calm_edit_products.json');

    if (!fs.existsSync(calmEditPath)) {
      throw new Error(`Seed data not found at ${calmEditPath}`);
    }
    const productsToInsert = JSON.parse(fs.readFileSync(calmEditPath, 'utf8'));

    await Product.insertMany(productsToInsert);
    console.log(`Database seeded successfully with ${productsToInsert.length} products!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
