const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');

const validateBookingTime = async (barberId, date, startTime, slotDuration) => {
  try {
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);

    // Check if barber has schedule for this date
    const schedule = await Schedule.findOne({
      barber: barberId,
      date: scheduleDate,
    });

    if (!schedule || !schedule.isWorkingDay) {
      return {
        isValid: false,
        message: 'Barber is not working on this date',
      };
    }

    // Find the slot
    const slotIndex = schedule.slots.findIndex(
      slot => slot.startTime === startTime
    );

    if (slotIndex === -1) {
      return {
        isValid: false,
        message: 'Invalid time slot',
      };
    }

    const slot = schedule.slots[slotIndex];

    // Check slot status
    if (slot.status !== 'available') {
      return {
        isValid: false,
        message: `Time slot is ${slot.status}`,
      };
    }

    return {
      isValid: true,
      slotIndex,
      slot,
    };
  } catch (error) {
    throw error;
  }
};

const checkBookingConflict = async (clientId, date, startTime) => {
  try {
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const existingBooking = await Booking.findOne({
      client: clientId,
      bookingDate: bookingDate,
      startTime: startTime,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingBooking) {
      return {
        hasConflict: true,
        booking: existingBooking,
      };
    }

    return {
      hasConflict: false,
    };
  } catch (error) {
    throw error;
  }
};

const validateCancellationWindow = (bookingDate, startTime, hoursBefore = 2) => {
  const appointmentTime = new Date(bookingDate);
  const [hours, minutes] = startTime.split(':');
  appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const now = new Date();
  const hoursDifference = (appointmentTime - now) / (1000 * 60 * 60);

  if (hoursDifference < hoursBefore) {
    return {
      canCancel: false,
      hoursLeft: hoursDifference,
      message: `Cannot cancel booking less than ${hoursBefore} hours before appointment`,
    };
  }

  return {
    canCancel: true,
    hoursLeft: hoursDifference,
  };
};

module.exports = {
  validateBookingTime,
  checkBookingConflict,
  validateCancellationWindow,
};