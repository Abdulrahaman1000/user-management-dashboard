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

const { protect } = require('../middleware/authMiddleware');

// Apply protection to specific routes instead of all routes
// This approach is more flexible than router.use(protect)
router.get('/', protect, getUsers);
router.post('/', protect, createUser);
router.get('/:id', protect, getUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;