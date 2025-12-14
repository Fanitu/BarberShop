const Barber = require('../barbersModel/barbersModel');
const User = require('../../Users/usersModel/userModel');
const Booking = require('../../Booking/bookingModel/bookingModel');

// @desc    Get all barbers (Directory)
// @route   GET /api/barbers
// @access  Public
exports.getBarbers = async (req, res) => {
  try {
    const { specialization, available, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (specialization) query.specialization = { $in: specialization.split(',') };
    if (available === 'true') query.isAvailable = true;

    const skip = (page - 1) * limit;

    const [barbers, total] = await Promise.all([
      Barber.find(query)
        .populate('user', 'name email phone profilePhoto')
        .select('-__v')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ rating: -1, experience: -1 }),
      Barber.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: barbers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: barbers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single barber details
// @route   GET /api/barbers/:id
// @access  Public
exports.getBarber = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id)
      .populate('user', 'name email phone profilePhoto createdAt')
      .populate('services', 'name price duration description');

    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    res.json({ success: true, data: barber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create barber profile (Onboarding)
// @route   POST /api/barbers
// @access  Private/Admin or User
exports.createBarber = async (req, res) => {
  try {
    const { userId, specialization, bio, experience, services, workingHours, breakStart, breakEnd } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const existingBarber = await Barber.findOne({ user: userId });
    if (existingBarber) return res.status(400).json({ success: false, message: 'User is already a barber' });

    // Update user role
    if (user.role !== 'barber') {
      user.role = 'barber';
      await user.save();
    }

    const barberData = {
      user: userId,
      specialization: specialization || [],
      bio: bio || '',
      experience: experience || 0,
      services: services || [],
      workingHours: workingHours || { start: '09:00', end: '18:00' },
      breakStart: breakStart || '13:00',
      breakEnd: breakEnd || '14:00',
      isAvailable: true,
      photo: req.file ? `/uploads/barbers/${req.file.filename}` : user.profilePhoto || 'default-barber.jpg'
    };

    const barber = await Barber.create(barberData);

    // NOTE: We do NOT create 30 days of empty schedules anymore. 
    // The AvailabilityCalculator will handle dates dynamically.

    res.status(201).json({
      success: true,
      data: barber,
      message: 'Barber profile created successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update barber profile (Settings)
// @route   PUT /api/barbers/:id
// @access  Private/Barber
exports.updateBarber = async (req, res) => {
  try {
    let barber = await Barber.findById(req.params.id);
    if (!barber) return res.status(404).json({ success: false, message: 'Barber not found' });

    // Auth Check
    if (barber.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.file) req.body.photo = `/uploads/barbers/${req.file.filename}`;

    // Update Profile
    barber = await Barber.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // NOTE: Removed "Regeneration" logic. 
    // New working hours apply immediately to dynamic calculations.

    res.json({
      success: true,
      data: barber,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get barber business statistics (Dashboard)
// @route   GET /api/barbers/:id/stats
// @access  Private/Barber
exports.getBarberStats = async (req, res) => {
  try {
    const barberId = req.params.id;
    const barber = await Barber.findById(barberId);
    
    if (!barber) return res.status(404).json({ success: false, message: 'Barber not found' });
    if (barber.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Time ranges
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Get Revenue & Booking Counts (The important stuff)
    const bookingStats = await Booking.aggregate([
      { $match: { barber: barber._id } },
      { 
        $group: { 
          _id: '$status', 
          count: { $sum: 1 }, 
          totalRevenue: { $sum: '$totalAmount' } 
        } 
      }
    ]);

    // 2. Get Monthly Performance
    const monthlyStats = await Booking.aggregate([
      { 
        $match: { 
          barber: barber._id, 
          bookingDate: { $gte: startOfMonth },
          status: 'completed'
        } 
      },
      { 
        $group: { 
          _id: null, 
          revenue: { $sum: '$totalAmount' }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    // 3. Get Upcoming Schedule (Next 5 bookings)
    const upcomingBookings = await Booking.find({
      barber: barberId,
      bookingDate: { $gte: startOfToday },
      status: { $in: ['pending', 'confirmed'] },
    })
    .populate('client', 'name phone')
    .sort({ bookingDate: 1, startTime: 1 })
    .limit(5);

    // Calculate Totals
    const totalRevenue = bookingStats.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
    const totalBookings = bookingStats.reduce((acc, curr) => acc + curr.count, 0);
    const completed = bookingStats.find(s => s._id === 'completed')?.count || 0;
    const cancelled = bookingStats.find(s => s._id === 'cancelled')?.count || 0;

    res.json({
      success: true,
      data: {
        financials: {
          totalRevenue,
          monthlyRevenue: monthlyStats[0]?.revenue || 0,
          monthlyCount: monthlyStats[0]?.count || 0
        },
        bookings: {
          total: totalBookings,
          completed,
          cancelled,
          completionRate: totalBookings ? ((completed / totalBookings) * 100).toFixed(1) : 0
        },
        upcoming: upcomingBookings
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Global Availability (Vacation Mode)
// @route   PUT /api/barbers/:id/availability
// @access  Private/Barber
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable, reason } = req.body;
    
    // Auth Check...
    const barber = await Barber.findById(req.params.id);
    if (!barber) return res.status(404).json({ success: false, message: 'Not found' });
    if (barber.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    barber.isAvailable = isAvailable;
    await barber.save();

    // Note: If they are setting isAvailable=false (Vacation), 
    // you might want to create a Blockout in the Schedule or Booking table 
    // for the duration, but for now, the global flag is sufficient to stop new bookings.

    res.json({
      success: true,
      message: isAvailable ? 'You are now available' : 'You are now unavailable'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};