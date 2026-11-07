import mongoose from 'mongoose';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import Product from './models/Product.js';
import User from './models/User.js';

/**
 * DESTRUCTIVE: deletes all products and users, then creates one admin account
 * from ADMIN_EMAIL / ADMIN_PASSWORD. Requires --yes to run.
 */
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@ennigmaparis.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const resetData = async () => {
  if (!process.argv.includes('--yes')) {
    console.error('This deletes ALL products and users. Re-run with --yes to confirm.');
    process.exit(1);
  }
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    console.error('Set ADMIN_PASSWORD (at least 12 characters) before running this script.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    await Product.deleteMany({});
    await User.deleteMany({});

    await User.create({
      name: 'Admin',
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: 'admin',
    });

    console.log(`Database reset. Admin account created for ${ADMIN_EMAIL}.`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

resetData();
