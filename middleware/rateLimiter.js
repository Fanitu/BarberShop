const rateLimit = require('express-rate-limit');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 8, // 5 attempts per hour
  message: {
    success: false,
    message: 'Too many login attempts, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Booking limiter
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bookings per hour
  message: {
    success: false,
    message: 'Too many booking attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter, bookingLimiter };