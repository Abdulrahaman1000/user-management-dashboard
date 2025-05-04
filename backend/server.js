// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorMiddleware');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL, // Frontend URL (e.g., http://localhost:3000)
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);   // Login / Logout routes
app.use('/api/users', userRoutes);  // User CRUD routes

// Error Handler
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
