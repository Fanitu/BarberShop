const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getRevenueStats
} = require('./adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require admin authorization
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/revenue', getRevenueStats);

module.exports = router;