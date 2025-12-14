const express = require('express');
const router = express.Router();
const {
  getBarbers,
  getBarber,
  createBarber,
  updateBarber,
  getBarberStats,
  updateAvailability,
} = require('../barberscontroller/barbersControllers');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { barberValidator } = require('../../utils/validatore');
const { validate } = require('../../middleware/validationMiddleware');

// Public routes
router.get('/', getBarbers);
router.get('/:id', getBarber);

// Protected routes - Barber specific
router.get('/:id/stats', protect, authorize('barber', 'admin'), getBarberStats);

// Barber management routes
router.post(  
  '/',
  protect,
  authorize('admin'),
  barberValidator,
  createBarber
);

router.put(
  '/:id',
  protect,
  authorize('barber', 'admin'),
  barberValidator,
  validate,
  updateBarber
);

// 🎯 NEW: Update availability route
router.put(
  '/:id/availability',
  protect,
  authorize('barber', 'admin'),
  updateAvailability
);

module.exports = router;