const { sendBookingStatusUpdate } = require('./emailService');

const sendBookingNotification = async (booking, oldStatus, newStatus) => {
  try {
    // Get booking with populated data
    const populatedBooking = await booking
      .populate('client')
      .populate({
        path: 'barber',
        populate: {
          path: 'user',
          select: 'name',
        },
      })
      .execPopulate();

    // Send email to client about status change
    if (populatedBooking.client && populatedBooking.client.email) {
      await sendBookingStatusUpdate({
        to: populatedBooking.client.email,
        clientName: populatedBooking.client.name,
        bookingId: booking._id,
        service: booking.service.name,
        date: booking.bookingDate,
        time: booking.startTime,
        status: newStatus,
        reason: booking.cancellationReason,
      });
    }

    // Add to notification log or database if needed
    console.log(`Booking ${booking._id} status changed from ${oldStatus} to ${newStatus}`);
    
    return true;
  } catch (error) {
    console.error('Error sending booking notification:', error);
    return false;
  }
};

module.exports = {
  sendBookingNotification,
};