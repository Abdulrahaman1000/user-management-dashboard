// backend/config/db.js

const mongoose = require('mongoose');
// Add this to your db connection file
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected to:', mongoose.connection.host);
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;