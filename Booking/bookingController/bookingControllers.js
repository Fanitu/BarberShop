const Booking = require('../bookingModel/bookingModel');
const Schedule = require('../../schedule/scheduleModel');
const Barber = require('../../Barbers/barbersModel/barbersModel');
const { sendBookingConfirmation, sendReminderEmail } = require('../../service/emailService');
const AvailabilityCalculator = require('../../utils/AvailabilityCalculator');
const {formatMinutesToTime ,parseTimeToMinutes} = require('../../utils/timeSlot');

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private
exports.createNewBooking = async (req, res) => {
  try {
    const { barberId, bookingdate, startTime, service, notes } = req.body;
    // Validate input
    if (!barberId || !bookingdate || startTime === undefined || !service) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
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
    // Check if barber is available
    if (!barber.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Barber is not available for bookings',
      });
    }

    // Parse date
     const scheduleDate = new Date(bookingdate);
    scheduleDate.setHours(0, 0, 0, 0);

    // Get or create schedule
    let schedule = await Schedule.findOne({
      barber: barberId,
      date: scheduleDate,
    });

    if (!schedule) {
        schedule = await Schedule.create({
        barber: barberId,
        date: scheduleDate,
        bookings: [],
      });
    }

  
    let existingBooking = []

    try {

    existingBooking = await Booking.findOne({
      client: req.user.id,
      bookingDate: scheduleDate,
      status: { $in: ['pending', 'confirmed'] },
    }).select('startTime endTime service') 
    || [];
      
    } catch (error) {
         console.log('Error fetching existing booking:', error); 
         existingBooking = [];
      
    }

    // Create calculator and validate
    const calculator = new AvailabilityCalculator(barber, schedule, existingBooking);
    const validation = calculator.validateTime(startTime, service.duration);
    
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        validation,
        alternatives: calculator.getAvailableWindows(service.duration).slice(0, 3),
      });
    }

    // Calculate total amount (20% down payment)
    const totalAmount = service.price;
    const downPaymentAmount = totalAmount * 0.2;
    const remainingAmount = totalAmount - downPaymentAmount;
    
    const bookingDate = scheduleDate;
    let endTime = parseTimeToMinutes(startTime) + service.duration;
    endTime = formatMinutesToTime(endTime);


    // Create booking
    const booking = await Booking.create({
      client: req.user.id,
      barber: barberId,
      schedule: schedule._id,
      service,
      bookingdate,
      startTime: startTime,
      endTime: endTime,
      totalAmount,
      remainingAmount,
      notes,
      status: 'pending',
      paymentStatus: 'pending',
      downPayment: {
        amount: downPaymentAmount,
      },
    });
    console.log(booking);

    // Update schedule with booking
    await schedule.addBooking({
      startTime: startTime,
      endTime:endTime ,
      bookingId: booking._id,
      serviceDuration: service.duration,
      clientName: req.user.name,
      serviceName: service.name,
    });

    res.status(201).json({
      success: true,
      data: booking,
      downPaymentAmount,
      message: 'Booking created successfully. Please arrive before 10 minutes.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { client: req.user.id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('barber', 'photo specialization')
      .populate({
        path: 'barber',
        populate: {
          path: 'user',
          select: 'name',
        },
      })
      .sort({ bookingdate: -1, startTime: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// @desc    Get all bookings (admin only)
// @route   GET /api/bookings/all
// @access  Private/Admin
exports.getAllBookings = async (req, res) => {
  try {
    const { date, status, barberId } = req.query;
    let query = {};

    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.bookingdate = {
        $gte: filterDate,
        $lt: nextDay,
      };
    }

    if (status) {
      query.status = status;
    }

    if (barberId) {
      query.barber = barberId;
    }

    const bookings = await Booking.find(query)
      .populate('client', 'name phone email')
      .populate('barber', 'specialization')
      .populate({
        path: 'barber',
        populate: {
          path: 'user',
          select: 'name',
        },
      })
      .sort({ bookingdate: -1, startTime: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private/Admin
exports.getBookingStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          todayBookings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$bookingdate", today] },
                    { $lt: ["$bookingdate", tomorrow] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalBookings: 0,
        totalRevenue: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        todayBookings: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get barber bookings
// @route   GET /api/bookings/barber/:barberId
// @access  Private/Barber
exports.getBarberBookings = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { status, date } = req.query;
    
    let query = { barber: barberId };

    if (status) {
      query.status = status;
    }

    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.bookingdate = {
        $gte: filterDate,
        $lt: nextDay,
      };
    }

    // Check authorization
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found',
      });
    }

    if (barber.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these bookings',
      });
    }

    const bookings = await Booking.find(query)
      .populate('client', 'name phone email')
      .populate({
        path: 'schedule',
        select: 'date',
      })
      .sort({ bookingdate: 1, startTime: 1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update booking status (barber only)
// @route   PUT /api/bookings/:id/status
// @access  Private/Barber
exports.updateBookingStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status, rejectionReason } = req.body;

    if (!['confirmed', 'cancelled', 'completed', 'no-show'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('barber')
      .populate('client');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if barber owns this booking
    if (booking.barber.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking',
      });
    }

    // Handle status transitions
    if (status === 'confirmed') {
      // Only pending bookings can be confirmed
      if (booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot confirm a ${booking.status} booking`,
        });
      }

      // Verify payment receipt exists
     /*  if (!booking.downPayment.receipt) {
        return res.status(400).json({
          success: false,
          message: 'Cannot confirm booking without down payment receipt',
        });*/
    }

    // Update booking
    booking.status = status;
    
    if (status === 'cancelled') {
      booking.cancellationReason = rejectionReason;
      
      // Free up the slot
      const schedule = await Schedule.findById(booking.schedule);
      if (schedule && schedule.slots[booking.slotIndex]) {
        schedule.slots[booking.slotIndex].status = 'available';
        schedule.slots[booking.slotIndex].booking = null;
        await schedule.save();
      }
    }

    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: `Booking ${status} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cancel booking (client only)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {

  console.log('Cancel booking request received');
  console.log('Request params:', req.params,req.body);
  try {
    console.log(11111)
    const bookingId = req.params.id;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
  console.log(booking)
console.log(2222)
    // Check if client owns the booking
  /*   if (booking.client.toString() !== req.user.id && req.user.role !== 'admin' || req.user.role !== 'barber') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    } */

    // Only pending or confirmed bookings can be cancelled by client
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${booking.status} booking`,
      });
    }
console.log(3333)
    // Check if booking is within cancellation window (e.g., 2 hours before)
   /*  const bookingDateTime = new Date(booking.bookingdate);
    const [hours, minutes] = booking.startTime.split(':');
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const now = new Date();
    const hoursDifference = (bookingDateTime - now) / (1000 * 60 * 60);

    if (hoursDifference < 2) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking less than 2 hours before appointment',
      });
    } */

    // Update booking
    booking.status = 'cancelled';
    
    // Free up the slot
    const schedule = await Schedule.findById(booking.schedule);
    if (schedule && schedule.slots[booking.slotIndex]) {
      schedule.slots[booking.slotIndex].status = 'available';
      schedule.slots[booking.slotIndex].booking = null;
      await schedule.save();
    }
console.log(5555)
    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get daily statistics
// @route   GET /api/bookings/stats/daily
// @access  Private/Admin
exports.getDailyStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const stats = await Booking.aggregate([
      {
        $match: {
          bookingdate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingdate' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get weekly statistics
// @route   GET /api/bookings/stats/weekly
// @access  Private/Admin
exports.getWeeklyStats = async (req, res) => {
  try {
    const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
    
    const stats = await Booking.aggregate([
      {
        $match: {
          bookingdate: { $gte: twelveWeeksAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%U', date: '$bookingdate' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get monthly statistics
// @route   GET /api/bookings/stats/monthly
// @access  Private/Admin
exports.getMonthlyStats = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const stats = await Booking.aggregate([
      {
        $match: {
          bookingdate: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$bookingdate' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};