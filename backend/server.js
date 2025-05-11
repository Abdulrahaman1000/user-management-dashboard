// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path'); // Add this
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize Express
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['set-cookie', 'Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Enhanced logging middleware (skip for static files)
app.use((req, res, next) => {
  if (!req.path.startsWith('/uploads')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'uploads')}`);
});