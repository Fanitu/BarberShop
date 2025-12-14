const Booking = require('../models/Booking');
const { sendReminderEmail } = require('../services/emailService');

// @desc    Send booking reminder (called by cron job)
// @route   POST /api/notifications/send-reminders
// @access  Private/Admin
exports.sendReminders = async (req, res) => {
  try {
    // Get bookings happening in the next 10 minutes
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    const bookings = await Booking.find({
      bookingDate: {
        $gte: now,
        $lte: tenMinutesFromNow,
      },
      status: 'confirmed',
      reminderSent: false,
    }).populate('client').populate({
      path: 'barber',
      populate: {
        path: 'user',
        select: 'name',
      },
    });

    let sentCount = 0;
    const results = [];

    for (const booking of bookings) {
      try {
        await sendReminderEmail({
          to: booking.client.email,
          clientName: booking.client.name,
          barberName: booking.barber.user.name,
          bookingDate: booking.bookingDate,
          startTime: booking.startTime,
          service: booking.service.name,
        });

        // Mark reminder as sent
        booking.reminderSent = true;
        await booking.save();

        sentCount++;
        results.push({
          bookingId: booking._id,
          clientEmail: booking.client.email,
          sent: true,
        });
      } catch (error) {
        results.push({
          bookingId: booking._id,
          clientEmail: booking.client.email,
          sent: false,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Sent ${sentCount} reminder(s)`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    // Get upcoming bookings for notifications
    const now = new Date();
    const upcomingBookings = await Booking.find({
      client: req.user.id,
      bookingDate: { $gte: now },
      status: { $in: ['confirmed', 'pending'] },
    })
      .populate('barber', 'photo')
      .populate({
        path: 'barber',
        populate: {
          path: 'user',
          select: 'name',
        },
      })
      .sort({ bookingDate: 1, startTime: 1 })
      .limit(10);

    // Get payment notifications
    const pendingPayments = await Payment.find({
      client: req.user.id,
      status: 'pending',
    })
      .populate('booking', 'bookingDate startTime')
      .limit(5);

    const notifications = [
      ...upcomingBookings.map(booking => ({
        type: 'booking',
        id: booking._id,
        title: 'Upcoming Appointment',
        message: `You have an appointment with ${booking.barber.user.name} on ${booking.bookingDate.toDateString()} at ${booking.startTime}`,
        date: booking.bookingDate,
        read: false,
      })),
      ...pendingPayments.map(payment => ({
        type: 'payment',
        id: payment._id,
        title: 'Payment Pending',
        message: `Your payment for booking on ${payment.booking.bookingDate.toDateString()} is pending verification`,
        date: payment.createdAt,
        read: false,
      })),
    ].sort((a, b) => b.date - a.date);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};