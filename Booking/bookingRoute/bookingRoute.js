const express = require('express');
const router = express.Router();
const {
  createNewBooking,
  getMyBookings,
  getBarberBookings,
  updateBookingStatus,
  cancelBooking,
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
  updateBookingStatus
);

module.exports = router;