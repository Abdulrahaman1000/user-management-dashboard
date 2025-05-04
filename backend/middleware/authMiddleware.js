// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Make sure this path is correct

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Not authorized' });
  }
};

module.exports = { protect };