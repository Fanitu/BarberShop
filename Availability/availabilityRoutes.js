// routes/availabilityRoutes.js
/**
 * 🎯 AVAILABILITY ROUTES
 * All endpoints for checking booking availability
 */

const express = require('express');
const router = express.Router();
const {
  getAvailableTimes,
  validateBookingTime,
  getMultiDayAvailability,
} = require('./availabilityController');

const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Public routes
router.get('/barber/:barberId', getAvailableTimes);
router.get('/barber/:barberId/multi-day', getMultiDayAvailability);
router.post('/validate', validateBookingTime);

// Add to booking routes (in bookingRoutes.js or here)
// router.post('/check', protect, checkAvailability); // From bookingController

module.exports = router;