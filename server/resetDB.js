import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import Product from './models/Product.js';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const resetData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('Clearing existing products...');
    await Product.deleteMany({});
    
    console.log('Clearing existing users...');
    await User.deleteMany({});

    console.log('Creating Admin User...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    await User.create({
      name: 'Admin',
      email: 'admin@ennigmaparis.com',
      passwordHash: passwordHash,
      role: 'admin'
    });

    console.log('Database reset successfully. Admin user created (admin@ennigmaparis.com / admin123).');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

resetData();
