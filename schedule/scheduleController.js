const Schedule = require('./scheduleModel');
const Barber = require('../Barbers/barbersModel/barbersModel');
const { generateTimeSlots } = require('../utils/timeSlot');

// @desc    Get barber schedule for a specific date
// @route   GET /api/schedules/barber/:barberId
// @access  Publi

// @desc    Bulk update schedule (set working days)
// @route   PUT /api/schedules/barber/:barberId/bulk
// @access  Private/Barber
exports.bulkUpdateSchedule = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { dates, isWorkingDay } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of dates',
      });
    }

    // Check if barber exists
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found',
      });
    }

    // Check authorization
    if (barber.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this schedule',
      });
    }

    const results = [];

    for (const dateStr of dates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);

      let schedule = await Schedule.findOne({
        barber: barberId,
        date,
      });

      if (schedule) {
        // Update existing schedule
        schedule.isWorkingDay = isWorkingDay;
        
        // If setting to non-working day, free all slots
        if (!isWorkingDay) {
          schedule.slots.forEach(slot => {
            if (slot.status !== 'booked') {
              slot.status = 'unavailable';
            }
          });
        }
        
        await schedule.save();
      } else {
        // Create new schedule for non-working day
        if (!isWorkingDay) {
          const slots = generateTimeSlots(
            barber.workingHours.start,
            barber.workingHours.end,
            barber.slotDuration,
            barber.breakStart,
            barber.breakEnd
          );

          // Mark all slots as unavailable
          slots.forEach(slot => {
            slot.status = 'unavailable';
          });

          schedule = await Schedule.create({
            barber: barberId,
            date,
            slots,
            isWorkingDay,
          });
        }
      }

      if (schedule) {
        results.push({
          date: schedule.date,
          isWorkingDay: schedule.isWorkingDay,
        });
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};