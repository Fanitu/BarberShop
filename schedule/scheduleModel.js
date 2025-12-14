const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
   bookingData: [{
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    serviceDuration: {
      type: Number,
      required: true,
    },
    clientName: String, // For quick reference
    serviceName: String, // For quick reference
  }],
  isWorkingDay: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
scheduleSchema.index({ barber: 1, date: 1 }, { unique: true });
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ 'bookings.booking': 1 });

scheduleSchema.methods.isTimeBooked = function(startTime, endTime) {
  const startMinutes = require('../utils/timeSlots').timeToMinutes(startTime);
  const endMinutes = require('../utils/timeSlots').timeToMinutes(endTime);
  
  return this.bookings.some(booking => {
    const bookingStart = require('../utils/timeSlots').timeToMinutes(booking.startTime);
    const bookingEnd = require('../utils/timeSlots').timeToMinutes(booking.endTime);
    
    // Check for overlap
    return startMinutes < bookingEnd && endMinutes > bookingStart;
  });
};

scheduleSchema.methods.addBooking = function(bookingData) {
  this.bookingData.push({
    startTime: bookingData.startTime,
    endTime: bookingData.endTime,
    booking: bookingData.bookingId,
    serviceDuration: bookingData.serviceDuration,
    clientName: bookingData.clientName,
    serviceName: bookingData.serviceName,
  });
  
  return this.save();
};

scheduleSchema.methods.removeBooking = function(bookingId) {
  this.bookings = this.bookings.filter(b => b.booking.toString() !== bookingId.toString());
  return this.save();
};

module.exports = mongoose.model('Schedule', scheduleSchema);











  /* customHours: {
    start: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    end: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
  },
  notes: String, // e.g., "Working half day", "Special event"
   */

// Index for efficient querying


// Virtual for total booked minutes
/* scheduleSchema.virtual('totalBookedMinutes').get(function() {
  return this.bookings.reduce((total, booking) => {
    return total + booking.serviceDuration;
  }, 0);
}); */

// Method to check if a time is already booked


// Method to add a booking

// Method to remove a booking

