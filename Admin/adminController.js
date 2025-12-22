const User = require('../Users/usersModel/userModel');
const Barber = require('../Barbers/barbersModel/barbersModel');
const Booking = require('../Booking/bookingModel/bookingModel');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all stats in parallel for better performance
    const [
      totalUsers,
      activeBarbers,
      totalBookings,
      totalRevenue,
      todayBookings,
      pendingBookings,
      revenueStats,
      userGrowth,
      bookingTrends
    ] = await Promise.all([
      User.countDocuments(),
      Barber.countDocuments({ isAvailable: true }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Booking.countDocuments({
        bookingdate: { $gte: today, $lt: tomorrow }
      }),
      Booking.countDocuments({ status: 'pending' }),
      // Last 7 days revenue
      Booking.aggregate([
        {
          $match: {
            bookingdate: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingdate' } },
            revenue: { $sum: '$totalAmount' },
            bookings: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      // User growth (last 30 days)
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      // Booking trends (last 7 days)
      Booking.aggregate([
        {
          $match: {
            bookingdate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingdate' } },
            bookings: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    // Calculate growth percentages
    const lastWeekRevenue = revenueStats.slice(0, -1).reduce((sum, day) => sum + day.revenue, 0);
    const currentWeekRevenue = revenueStats.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
    const revenueGrowth = lastWeekRevenue > 0 
      ? ((currentWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1)
      : 0;

    const lastWeekBookings = bookingTrends.slice(0, -1).reduce((sum, day) => sum + day.bookings, 0);
    const currentWeekBookings = bookingTrends.slice(-7).reduce((sum, day) => sum + day.bookings, 0);
    const bookingGrowth = lastWeekBookings > 0
      ? ((currentWeekBookings - lastWeekBookings) / lastWeekBookings * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeBarbers,
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayBookings,
        pendingBookings,
        revenueGrowth: parseFloat(revenueGrowth),
        bookingGrowth: parseFloat(bookingGrowth),
        revenueStats,
        userGrowth,
        bookingTrends,
        // Performance metrics
        averageRevenue: totalRevenue[0]?.total / (totalBookings || 1),
        peakHour: await getPeakHour(),
        topService: await getTopService(),
        completionRate: await getCompletionRate()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper functions
async function getPeakHour() {
  const result = await Booking.aggregate([
    {
      $group: {
        _id: { $hour: { $toDate: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);
  return result[0]?._id || 'N/A';
}

async function getTopService() {
  const result = await Booking.aggregate([
    {
      $group: {
        _id: '$service.name',
        revenue: { $sum: '$totalAmount' },
        bookings: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 1 }
  ]);
  return result[0] || { _id: 'N/A', revenue: 0 };
}

async function getCompletionRate() {
  const [completed, total] = await Promise.all([
    Booking.countDocuments({ status: 'completed' }),
    Booking.countDocuments({ status: { $in: ['completed', 'cancelled', 'no-show'] } })
  ]);
  return total > 0 ? (completed / total * 100).toFixed(1) : 0;
}

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status) query.isActive = status === 'active';

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['client', 'barber', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow demoting the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the last admin'
        });
      }
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      data: user,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get revenue statistics
// @route   GET /api/admin/revenue
// @access  Private/Admin
exports.getRevenueStats = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    let groupFormat, dateRange;

    switch (period) {
      case 'daily':
        groupFormat = '%Y-%m-%d';
        dateRange = 30; // Last 30 days
        break;
      case 'weekly':
        groupFormat = '%Y-%U';
        dateRange = 12; // Last 12 weeks
        break;
      default:
        groupFormat = '%Y-%m';
        dateRange = 12; // Last 12 months
    }

    const revenueStats = await Booking.aggregate([
      {
        $match: {
          bookingdate: {
            $gte: new Date(Date.now() - dateRange * 30 * 24 * 60 * 60 * 1000)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$bookingdate' }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const barberRevenue = await Booking.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$barber',
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'barbers',
          localField: '_id',
          foreignField: '_id',
          as: 'barberInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'barberInfo.user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        revenueStats,
        barberRevenue,
        period,
        totalRevenue: revenueStats.reduce((sum, item) => sum + item.revenue, 0),
        totalBookings: revenueStats.reduce((sum, item) => sum + item.bookings, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add to your adminController.js

// @desc    Get revenue comparison between periods
// @route   GET /api/admin/revenue/compare
// @access  Private/Admin
exports.getRevenueComparison = async (req, res) => {
  try {
    const { startDate, endDate, compareStart, compareEnd } = req.query;
    
    const currentPeriod = await Booking.aggregate([
      {
        $match: {
          bookingdate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          averageTicket: { $avg: '$totalAmount' }
        }
      }
    ]);

    const previousPeriod = await Booking.aggregate([
      {
        $match: {
          bookingdate: {
            $gte: new Date(compareStart),
            $lte: new Date(compareEnd)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          averageTicket: { $avg: '$totalAmount' }
        }
      }
    ]);

    const current = currentPeriod[0] || { revenue: 0, bookings: 0, averageTicket: 0 };
    const previous = previousPeriod[0] || { revenue: 0, bookings: 0, averageTicket: 0 };

    const growth = previous.revenue > 0 
      ? ((current.revenue - previous.revenue) / previous.revenue * 100)
      : current.revenue > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        currentPeriod: {
          ...current,
          startDate,
          endDate
        },
        previousPeriod: {
          ...previous,
          startDate: compareStart,
          endDate: compareEnd
        },
        growth: parseFloat(growth.toFixed(2)),
        comparison: {
          revenueChange: current.revenue - previous.revenue,
          bookingsChange: current.bookings - previous.bookings,
          avgTicketChange: current.averageTicket - previous.averageTicket
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get revenue forecast
// @route   GET /api/admin/revenue/forecast
// @access  Private/Admin
exports.getRevenueForecast = async (req, res) => {
  try {
    const { months = 3 } = req.query;
    
    // Get historical data for forecasting
    const historicalData = await Booking.aggregate([
      {
        $match: {
          bookingdate: {
            $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // Last 6 months
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$bookingdate' },
            month: { $month: '$bookingdate' }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Simple forecasting (average of last 3 months)
    const lastThreeMonths = historicalData.slice(-3);
    const avgRevenue = lastThreeMonths.reduce((sum, month) => sum + month.revenue, 0) / 3;
    const avgBookings = lastThreeMonths.reduce((sum, month) => sum + month.bookings, 0) / 3;

    // Generate forecast
    const forecast = [];
    let currentDate = new Date();
    
    for (let i = 1; i <= parseInt(months); i++) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      forecast.push({
        period: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`,
        forecastedRevenue: avgRevenue * (1 + (i * 0.05)), // 5% monthly growth assumption
        forecastedBookings: avgBookings * (1 + (i * 0.03)), // 3% monthly growth assumption
        confidence: Math.max(85 - (i * 5), 60) // Decreasing confidence for future months
      });
    }

    res.json({
      success: true,
      data: {
        historical: historicalData,
        forecast,
        metrics: {
          averageRevenue: avgRevenue,
          averageBookings: avgBookings,
          growthRate: '5% monthly',
          confidence: 'High for next month'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};