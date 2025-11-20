const Booking = require('../bookingModel/bookingModel');
const Barber = require('../../Barbers/barbersModel/barbersModel');

const createBooking = async (req, res) => {
  try {
    const { userId, barberId, bookingDate, bookingTime } = req.body;

    console.log(`📝 Creating booking for user ${userId} with barber ${barberId}`);

    // 🛡 Check 1: Is this time slot already booked?
    const existingBooking = await Booking.findOne({
      barber: barberId,
      bookingDate: new Date(bookingDate),
      bookingTime: bookingTime,
      status: 'confirmed'
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: '⏰ Sorry, this time slot is already booked!'
      });
    }

    // 🛡 Check 2: Is the barber available?
    const barber = await Barber.findById(barberId);
    if (!barber || !barber.isAvailable) {
      return res.status(400).json({
        success: false,
        message: '💈 Barber is not available for bookings'
      });
    }

    // ✅ Create the booking if all checks pass
    const newBooking = await Booking.create({
      user: userId,
      barber: barberId,
      bookingDate: new Date(bookingDate),
      bookingTime: bookingTime
    });

    console.log('✅ Booking created successfully!');
    res.json({
      success: true,
      message: '🎉 Booking confirmed!',
      bookingId: newBooking._id
    });

  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating booking'
    });
  }
}

module.exports = {
  createBooking
};