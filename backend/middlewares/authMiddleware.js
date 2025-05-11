// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const protect = async (req, res, next) => {
  // 1. SAFE token extraction
  let token = null;
  try {
    const authHeader = req.headers?.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]?.trim();
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }
  } catch (e) {
    console.error('Token extraction error:', e.message);
  }

  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  // 2. SAFE JWT verification
  let decoded = null;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'emergency_secret_123', { algorithms: ['HS256'] });
  } catch (e) {
    console.error('JWT verification failed:', e.message);
    return res.status(401).json({ message: 'Invalid token' });
  }

  // 3. SAFE payload validation
  if (!decoded?.user?.id && !decoded?.id) {
    console.error('Invalid token payload structure:', decoded);
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const userId = decoded.user?.id || decoded.id;

  // 4. SAFE user attachment
  try {
    // Minimal user data attachment
    req.user = {
      id: userId,
      role: decoded.user?.role || decoded.role || 'user',
      email: decoded.user?.email || decoded.email || 'no-email@example.com'
    };
    
    return next();
    
  } catch (e) {
    console.error('Final middleware error:', e.message);
    // LAST RESORT: Allow continuation with basic user data
    req.user = { id: userId, role: 'user' };
    return next();
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { protect, adminOnly };