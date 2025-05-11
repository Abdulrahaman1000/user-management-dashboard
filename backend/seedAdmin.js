// backend/seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');
const connectDB = require('./config/db');

const seedAdmin = async () => {
  await connectDB();

  const existingAdmin = await User.findOne({ email: 'admin@example.com' });
  if (existingAdmin) {
    console.log('Admin already exists');
    return process.exit();
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const adminUser = new User({
    name: 'Super Admin',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin',
    status: 'active',
  });

  await adminUser.save();
  console.log('Admin seeded ✅');
  process.exit();
};

seedAdmin();
