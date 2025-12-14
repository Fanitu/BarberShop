const express = require('express');
const router = express.Router();
const {
  getBarberSchedule,
  updateSlotStatus,
  bulkUpdateSchedule,
} = require('./scheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.put(
  '/barber/:barberId/bulk',
  protect,
  authorize('barber', 'admin'),
  bulkUpdateSchedule
);

module.exports = router;