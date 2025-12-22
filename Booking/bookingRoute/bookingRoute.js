const express = require('express');
const router = express.Router();
const {
  createNewBooking,
  getMyBookings,
  getBarberBookings,
  updateBookingStatus,
  cancelBooking,
  getAllBookings,  // Add this
  getBookingStats, // Add this
  getDailyStats,   // Add this
  getWeeklyStats,  // Add this
  getMonthlyStats  // Add this
} = require('../bookingController/bookingControllers');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { bookingValidator } = require('../../utils/validatore');
const { validate, validateBooking } = require('../../middleware/validationMiddleware');
const { bookingLimiter } = require('../../middleware/rateLimiter');

// Client routes
router.post(
  '/',
  protect,
  authorize('client'),
  bookingLimiter,
  bookingValidator,
 ((req, res, next) => 
 {
  console.log(req.body);
  console.log("creating route accessed")
  next()
 }
),
  createNewBooking
);

router.get(
  '/my-bookings',
  protect,
  getMyBookings
);

router.put(
  '/:id/cancel',
  protect,
  authorize('client'),
  cancelBooking
);

// Barber routes
router.get(
  '/barber/:barberId',
  protect,
  authorize('barber', 'admin'),
  getBarberBookings
);

router.put(
  '/:id/status',
  protect,
  authorize('barber', 'admin'),
  ((req, res, next) => 
 {
  console.log(req.body);
  console.log("updating route accessed")
  next()
 }
),
  updateBookingStatus
);

// Admin routes
router.get(
  '/all',
  protect,
  authorize('admin'),
  getAllBookings
);

router.get(
  '/stats',
  protect,
  authorize('admin'),
  getBookingStats
);

router.get(
  '/stats/daily',
  protect,
  authorize('admin'),
  getDailyStats
);

router.get(
  '/stats/weekly',
  protect,
  authorize('admin'),
  getWeeklyStats
);

router.get(
  '/stats/monthly',
  protect,
  authorize('admin'),
  getMonthlyStats
);

module.exports = router;