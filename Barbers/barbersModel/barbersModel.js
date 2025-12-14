const mongoose = require('mongoose');

const barberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  specialization: [{
    type: String,
    enum: ['haircut', 'beard-trim', 'shaving', 'hair-color', 'facial', 'hair-treatment'],
  }],
  bio: {
    type: String,
    maxlength: 500,
  },
  experience: {
    type: Number,
    min: 0,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  photo: {
    type: String,
    default: 'default-barber.jpg',
  },
 workingHours: {
    start: {
      type: String,
      default: '09:00',
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    end: {
      type: String,
      default: '18:00',
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
  },
  breakStart: {
    type: String,
    default: '13:00',
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  breakEnd: {
    type: String,
    default: '14:00',
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  minimumSlotDuration: {
    type: Number,
    default: 15, // 15-minute minimum increments
    enum: [5, 10, 15, 30], // Can book in 5, 10, 15, or 30-min increments
    description: 'Minimum time increment for bookings (in minutes)',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  services: [{
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 5, // Minimum 5-minute service
      max: 240, // Maximum 4-hour service
      description: 'Duration in minutes',
    },
    description: String,
    category: {
      type: String,
      enum: ['haircut', 'beard', 'color', 'treatment', 'other'],
    },
  }],
});

module.exports = mongoose.model('Barber', barberSchema);