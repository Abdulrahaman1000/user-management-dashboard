// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { protect } = require('../middlewares/authMiddleware');

// Ultra-stable login route
router.post('/login', async (req, res) => {
  // Basic validation
  if (!req.body?.email || !req.body?.password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const { email, password } = req.body;

    // Database access with multiple fallbacks
    let user;
    try {
      // Try Mongoose model first
      user = await mongoose.model('User').findOne({ email }).select('+password').lean();
      
      // Fallback to native driver
      if (!user && mongoose.connection.db) {
        user = await mongoose.connection.db.collection('users').findOne({ email });
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ message: 'Authentication service unavailable' });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Password verification
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password || '');
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return res.status(500).json({ message: 'Authentication error' });
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Token generation
    const payload = {
      user: {
        id: user._id.toString(),
        role: user.role || 'user'
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    return res.json({ 
      token,
      role: user.role,
      id: user._id 
    });

  } catch (err) {
    console.error('Unexpected login error:', err);
    return res.status(500).json({ message: 'Authentication failed' });
  }
});

// Bulletproof /me endpoint
router.get('/me', protect, async (req, res) => {
  try {
    // If middleware attached basic user data
    if (req.user?.id && !req.user._id) {
      return res.json({
        id: req.user.id,
        email: req.user.email || 'unknown@example.com',
        role: req.user.role || 'user'
      });
    }

    // If we have full user data
    if (req.user?._id) {
      return res.json({
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
      });
    }

    // Final fallback
    return res.status(404).json({ message: 'User data not available' });

  } catch (err) {
    console.error('Error in /me endpoint:', err);
    return res.status(500).json({ message: 'Could not retrieve user data' });
  }
});

module.exports = router;