/**
 * Database Seed Script
 *
 * Populates the database with initial data if collections are empty.
 * Safe to run multiple times — only inserts when collections are empty.
 *
 * Usage: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');

const ADMIN_USER = {
  name: 'Admin',
  email: 'admin@klblifesciences.com',
  password: 'Admin@123',
  role: 'admin',
};

const SAMPLE_PRODUCTS = [
  {
    name: 'Paracetamol 500mg',
    price: 35,
    category: 'Pain Relief',
    description: 'Paracetamol tablets for relief of mild to moderate pain and fever. Each tablet contains 500mg paracetamol.',
    manufacturer: 'KLB Lifesciences Pvt. Ltd.',
    dosage: '500mg',
    subtitle: '500mg Tablets',
    stock: 500,
    requiresPrescription: false,
    featured: true,
    image: '',
    images: [],
  },
  {
    name: 'Amoxicillin 250mg',
    price: 120,
    category: 'Antibiotics',
    description: 'Amoxicillin capsules for the treatment of bacterial infections. Prescription required.',
    manufacturer: 'KLB Lifesciences Pvt. Ltd.',
    dosage: '250mg',
    subtitle: '250mg Capsules',
    stock: 300,
    requiresPrescription: true,
    featured: true,
    image: '',
    images: [],
  },
  {
    name: 'Cetirizine 10mg',
    price: 45,
    category: 'Allergy',
    description: 'Cetirizine hydrochloride tablets for relief of allergy symptoms including sneezing, runny nose, and itchy eyes.',
    manufacturer: 'KLB Lifesciences Pvt. Ltd.',
    dosage: '10mg',
    subtitle: '10mg Tablets',
    stock: 400,
    requiresPrescription: false,
    featured: false,
    image: '',
    images: [],
  },
  {
    name: 'Omeprazole 20mg',
    price: 85,
    category: 'Digestive Health',
    description: 'Omeprazole capsules for management of gastric acid-related conditions including heartburn and acid reflux.',
    manufacturer: 'KLB Lifesciences Pvt. Ltd.',
    dosage: '20mg',
    subtitle: '20mg Capsules',
    stock: 350,
    requiresPrescription: false,
    featured: true,
    image: '',
    images: [],
  },
  {
    name: 'Metformin 500mg',
    price: 60,
    category: 'Diabetes',
    description: 'Metformin hydrochloride tablets for management of type 2 diabetes mellitus. Prescription required.',
    manufacturer: 'KLB Lifesciences Pvt. Ltd.',
    dosage: '500mg',
    subtitle: '500mg Tablets',
    stock: 250,
    requiresPrescription: true,
    featured: false,
    image: '',
    images: [],
  },
  {
    name: 'Multivitamin Daily',
    price: 150,
    category: 'Preventive Healthcare',
    description: 'Daily multivitamin supplement with essential vitamins and minerals for overall health and wellness.',
    manufacturer: 'KLB Lifesciences Pvt. Ltd.',
    dosage: 'One tablet daily',
    subtitle: 'Daily Supplement',
    stock: 600,
    requiresPrescription: false,
    featured: true,
    image: '',
    images: [],
  },
  {
    name: 'Azithromycin 500mg',
    price: 180,
    category: 'Antibiotics',
    description: 'Azithromycin tablets for the treatment of bacterial infections including respiratory and skin infections. Prescription required.',
    manufacturer: 'KLB Lifesciences Pvt. Ltd.',
    dosage: '500mg',
    subtitle: '500mg Tablets',
    stock: 200,
    requiresPrescription: true,
    featured: false,
    image: '',
    images: [],
  },
  {
    name: 'Ibuprofen 400mg',
    price: 40,
    category: 'Pain Relief',
    description: 'Ibuprofen tablets for relief of pain, inflammation, and fever.',
    manufacturer: 'KLB Lifesciences Pvt. Ltd.',
    dosage: '400mg',
    subtitle: '400mg Tablets',
    stock: 450,
    requiresPrescription: false,
    featured: false,
    image: '',
    images: [],
  },
];

const seed = async () => {
  try {
    await connectDB();

    // Seed admin user
    const userCount = await User.countDocuments({ role: 'admin' });
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 12);
      await User.create({ ...ADMIN_USER, password: hashedPassword });
      process.stdout.write(`[seed] Admin user created: ${ADMIN_USER.email}\n`);
    } else {
      process.stdout.write(`[seed] Admin user already exists — skipping\n`);
    }

    // Seed products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany(SAMPLE_PRODUCTS);
      process.stdout.write(`[seed] ${SAMPLE_PRODUCTS.length} products created\n`);
    } else {
      process.stdout.write(`[seed] ${productCount} products already exist — skipping\n`);
    }

    process.stdout.write('[seed] Done\n');
    process.exit(0);
  } catch (error) {
    process.stderr.write(`[seed] Error: ${error.message}\n`);
    process.exit(1);
  }
};

seed();
