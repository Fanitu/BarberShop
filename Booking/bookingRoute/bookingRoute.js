const express = require('express');
const router = express.Router();
const { createBooking } = require('../bookingController/bookingControllers');

// 🎯 ROUTE 2: Create a new booking
router.post('/', createBooking);

module.exports = router;