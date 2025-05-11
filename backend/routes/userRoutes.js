// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware'); // Add this line
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// Admin-only routes
router.get('/', protect, adminOnly, getUsers);
router.post('/', 
  protect,
  adminOnly,
  upload.single('profilePhoto'), // Add file upload middleware
  createUser
);

router.delete('/:id', protect, adminOnly, deleteUser);

// Authenticated user routes
router.get('/:id', protect, getUser);
router.put('/:id',
  protect,
  upload.single('profilePhoto'), // Add file upload middleware
  updateUser
);

module.exports = router;