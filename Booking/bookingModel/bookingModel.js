// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,  // This is like a link to the User
    ref: 'User',  // Reference to User model
    required: true 
  },
  barber: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',  // Reference to Barber model
    required: true 
  },
  bookingDate: { 
    type: Date, 
    required: true  // Which day they want to book
  },
  bookingTime: { 
    type: String, 
    required: true  // What time (like "14:30")
  },
  status: { 
    type: String, 
    enum: ['confirmed', 'cancelled'],  // Can only be these two values
    default: 'confirmed'  // Automatically set to 'confirmed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);