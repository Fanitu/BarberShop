const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: true,
  },
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true,
  },
  service: {
    name: String,
    price: Number,
    duration: Number,
  },
  bookingdate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'refunded'],
    default: 'pending',
  },
  downPayment: {
    amount: Number,
    receipt: String,
    paidAt: Date,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  remainingAmount: {
    type: Number,
    default: 0,
  },
  notes: String,
  reminderSent: {
    type: Boolean,
    default: false,
  },
  cancellationReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
bookingSchema.index({ client: 1, bookingdate: -1 });
bookingSchema.index({ barber: 1, bookingdate: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingdate: 1, startTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);