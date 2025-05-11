// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Admin-only routes
router.get('/', protect, adminOnly, getUsers);       // View all users
router.post('/', protect, adminOnly, createUser);    // Create a new user
router.delete('/:id', protect, adminOnly, deleteUser); // Delete a user

// Routes accessible by any authenticated user (can be restricted further if needed)
router.get('/:id', protect, getUser);                // Get a specific user
router.put('/:id', protect, updateUser);             // Update user info

module.exports = router;
