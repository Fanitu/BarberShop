// controllers/availabilityController.js
/**
 * 🎯 AVAILABILITY CONTROLLER
 * Handles all availability-related endpoints
 */

const Barber = require('../Barbers/barbersModel/barbersModel');
const Schedule = require('../schedule/scheduleModel');
const Booking = require('../Booking/bookingModel/bookingModel');
const AvailabilityCalculator = require('../utils/AvailabilityCalculator');
const { parseTimeToMinutes, formatMinutesToTime, formatTimeForDisplay } = require('../utils/timeSlot');

// @desc    Get available times for a specific service
// @route   GET /api/availability/barber/:barberId
// @access  Public
exports.getAvailableTimes = async (req, res) => {
  try {
     
    const { barberId } = req.params;
    const { date, serviceDuration, serviceId } = req.query;
    
    // Validate required parameters
    if (!date || !serviceDuration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date and serviceDuration parameters',
      });
    }
    
    const duration = parseInt(serviceDuration);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid serviceDuration',
      });
    }
    
    // Get barber details
    const barber = await Barber.findById(barberId)
      .populate('user', 'name')
      .select('workingHours breakStart breakEnd services minimumSlotDuration isAvailable');
    
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found',
      });
    }
    
    // Check if barber is available
    if (!barber.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Barber is not currently available for bookings',
      });
    }
    
    // If serviceId provided, validate it exists
    let selectedService = null;
    if (serviceId && barber.services && barber.services.length > 0) {
      selectedService = barber.services.find(s => s._id.toString() === serviceId.toString());
    }
    
    // Parse date
    const scheduleDate = new Date(date);
    scheduleDate.setUTCDate(0, 0, 0, 0);
   /*  if(!isNaN(scheduleDate.valueOf())){
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    } */
    
    // Get or create schedule for the day
    let schedule = await Schedule.findOne({
      barber: barberId,
      date: scheduleDate,
    });
    
    // If no schedule exists, create an empty one
    if (!schedule) {
      schedule = await Schedule.create({
        barber: barberId,
        date: scheduleDate,
        bookings: [],
        isWorkingDay: true,
      });
    }
    
    // Check if it's a working day
    if (!schedule.isWorkingDay) {
      return res.json({
        success: true,
        data: {
          date: scheduleDate,
          barberName: barber.user?.name || 'Barber',
          isWorkingDay: false,
          availableTimes: [],
          message: 'Barber is not working on this day',
        },
      });
    }
    
    // Get existing bookings for this day
    const existingBookings = await Booking.find({
      barber: barberId,
      bookingDate: scheduleDate,
      status: { $in: ['pending', 'confirmed'] },
    }).select('startTime endTime service');
    
    // Create availability calculator
    const calculator = new AvailabilityCalculator(
      barber,
      schedule,
      existingBookings,
      5 // 5-minute buffer between appointments
    );
    
    // Get available windows
    const availableWindows = calculator.getAvailableWindows(duration);
    
    // Format for frontend
    const formattedWindows = availableWindows.map(window => ({
      startTime: window.startTime,
      endTime: window.endTime,
      display: `${formatTimeForDisplay(window.startTime)} - ${formatTimeForDisplay(window.endTime)}`,
      startMinutes: window.startMinutes,
      endMinutes: window.endMinutes,
      duration: window.duration,
    }));
    
    // Get day summary
    const daySummary = calculator.getDaySummary(duration);
    
    // Get next available slot
    const nextSlot = calculator.getNextAvailableSlot(duration);
    
    // Prepare response
    const response = {
      success: true,
      data: {
        date: scheduleDate,
        barber: {
          id: barber._id,
          name: barber.user?.name || 'Barber',
          isAvailable: barber.isAvailable,
          workingHours: barber.workingHours,
          breakTime: barber.breakStart && barber.breakEnd ? 
            `${barber.breakStart} - ${barber.breakEnd}` : null,
        },
        requestedService: selectedService ? {
          name: selectedService.name,
          duration: selectedService.duration,
          price: selectedService.price,
        } : {
          duration: duration,
        },
        constraints: {
          bufferMinutes: 5,
          minimumIncrement: barber.minimumSlotDuration || 15,
          isWorkingDay: schedule.isWorkingDay,
          customHours: schedule.customHours,
        },
        availableTimes: formattedWindows,
        summary: {
          totalAvailable: formattedWindows.length,
          daySummary: daySummary,
          nextAvailable: nextSlot ? {
            time: `${formatTimeForDisplay(nextSlot.startTime)} - ${formatTimeForDisplay(nextSlot.endTime)}`,
            startTime: nextSlot.startTime,
          } : null,
          peakHours: this.findPeakHours(daySummary),
        },
        suggestions: this.generateSuggestions(formattedWindows, duration),
      },
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error getting available times:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Validate a specific time for booking
// @route   POST /api/availability/validate
// @access  Public
exports.validateBookingTime = async (req, res) => {
  try {
    const { barberId, date, startTime, serviceDuration } = req.body;
    
    // Validate required fields
    if (!barberId || !date || !startTime || !serviceDuration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide barberId, date, startTime, and serviceDuration',
      });
    }
    
    // Get barber
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found',
      });
    }
    
    // Parse date
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);
    
    // Get schedule
    let schedule = await Schedule.findOne({
      barber: barberId,
      date: scheduleDate,
    });
    
    if (!schedule) {
      schedule = { bookings: [] };
    }
    
    // Get existing bookings
    const existingBookings = await Booking.find({
      barber: barberId,
      bookingDate: scheduleDate,
      status: { $in: ['pending', 'confirmed'] },
    });
    
    // Create calculator
    const calculator = new AvailabilityCalculator(
      barber,
      schedule,
      existingBookings
    );
    
    // Validate the time
    const validation = calculator.validateTime(startTime, parseInt(serviceDuration));
    
    res.json({
      success: true,
      data: {
        requestedTime: {
          startTime,
          endTime: formatMinutesToTime(parseTimeToMinutes(startTime) + parseInt(serviceDuration)),
          serviceDuration,
        },
        validation,
        alternativeTimes: validation.valid ? [] : 
          calculator.getAvailableWindows(parseInt(serviceDuration)).slice(0, 3),
      },
    });
    
  } catch (error) {
    console.error('Error validating time:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get multi-day availability (for calendar view)
// @route   GET /api/availability/barber/:barberId/multi-day
// @access  Public
exports.getMultiDayAvailability = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { startDate, endDate, serviceDuration } = req.query;
    
    if (!startDate || !endDate || !serviceDuration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide startDate, endDate, and serviceDuration',
      });
    }
    
    const barber = await Barber.findById(barberId)
      .populate('user', 'name')
      .select('workingHours breakStart breakEnd');
    
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found',
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = parseInt(serviceDuration);
    
    const dailyAvailability = [];
    
    // Check each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Get schedule for this day
      const schedule = await Schedule.findOne({
        barber: barberId,
        date: { $gte: new Date(dateStr), $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
      });
      
      // Get bookings for this day
      const existingBookings = await Booking.find({
        barber: barberId,
        bookingDate: { $gte: new Date(dateStr), $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
        status: { $in: ['pending', 'confirmed'] },
      });
      
      // Create calculator
      const calculator = new AvailabilityCalculator(
        barber,
        schedule || { bookings: [] },
        existingBookings
      );
      
      // Get available windows
      const windows = calculator.getAvailableWindows(duration);
      
      dailyAvailability.push({
        date: dateStr,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        isWorkingDay: schedule ? schedule.isWorkingDay : true,
        availableSlots: windows.length,
        hasAvailability: windows.length > 0,
        nextAvailable: windows.length > 0 ? windows[0] : null,
      });
    }
    
    res.json({
      success: true,
      data: {
        barber: {
          name: barber.user?.name,
          id: barber._id,
        },
        serviceDuration: duration,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        dailyAvailability,
        summary: {
          totalDays: dailyAvailability.length,
          availableDays: dailyAvailability.filter(d => d.hasAvailability).length,
          recommendedDay: dailyAvailability.find(d => d.hasAvailability && d.availableSlots > 3),
        },
      },
    });
    
  } catch (error) {
    console.error('Error getting multi-day availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Helper: Find peak hours from day summary
exports.findPeakHours = (daySummary) => {
  const entries = Object.entries(daySummary);
  if (entries.length === 0) return [];
  
  const maxSlots = Math.max(...entries.map(([_, count]) => count));
  return entries
    .filter(([_, count]) => count === maxSlots)
    .map(([hour]) => `${hour}:00 - ${parseInt(hour) + 1}:00`);
};

// Helper: Generate smart suggestions
exports.generateSuggestions = (availableWindows, duration) => {
  const suggestions = [];
  
  if (availableWindows.length === 0) {
    suggestions.push({
      type: 'no_availability',
      message: `No ${duration}-minute slots available`,
      action: 'Try a different date or shorter service',
    });
    return suggestions;
  }
  
  // Morning suggestion
  const morningSlots = availableWindows.filter(w => w.startMinutes < 12 * 60);
  if (morningSlots.length > 0) {
    suggestions.push({
      type: 'morning',
      message: 'Morning appointments available',
      bestTime: morningSlots[0].display,
      benefit: 'Typically less busy',
    });
  }
  
  // Afternoon suggestion
  const afternoonSlots = availableWindows.filter(w => 
    w.startMinutes >= 12 * 60 && w.startMinutes < 17 * 60
  );
  if (afternoonSlots.length > 0) {
    suggestions.push({
      type: 'afternoon',
      message: 'Afternoon slots available',
      bestTime: afternoonSlots[0].display,
      benefit: 'Convenient for after work',
    });
  }
  
  // Earliest suggestion
  if (availableWindows.length > 0) {
    suggestions.push({
      type: 'earliest',
      message: 'Earliest available slot',
      time: availableWindows[0].display,
      benefit: 'Get your appointment done early',
    });
  }
  
  return suggestions;
};