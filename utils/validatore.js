const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .withMessage('Please provide a valid phone number'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const bookingValidator = [
  body('barberId')
    .notEmpty()
    .withMessage('Barber ID is required')
    .isMongoId()
    .withMessage('Invalid Barber ID'),
  
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('slotIndex')
    .notEmpty()
    .withMessage('Slot index is required')
    .isInt({ min: 0 })
    .withMessage('Invalid slot index'),
  
  body('service')
    .notEmpty()
    .withMessage('Service is required')
    .isObject()
    .withMessage('Service must be an object'),
  
  body('service.name')
    .notEmpty()
    .withMessage('Service name is required'),
  
  body('service.price')
    .notEmpty()
    .withMessage('Service price is required')
    .isFloat({ min: 0 })
    .withMessage('Invalid service price'),
  
  body('service.duration')
    .notEmpty()
    .withMessage('Service duration is required')
    .isInt({ min: 15 })
    .withMessage('Invalid service duration'),
];

const barberValidator = [
  body('specialization')
    .optional()
    .isArray()
    .withMessage('Specialization must be an array'),
  
  body('specialization.*')
    .isString()
    .withMessage('Each specialization must be a string'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a positive number'),
  
  body('workingHours.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format (HH:MM)'),
  
  body('workingHours.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format (HH:MM)'),
  
  body('slotDuration')
    .optional()
    .isIn([30, 60, 90, 120])
    .withMessage('Slot duration must be 30, 60, 90, or 120 minutes'),
];

module.exports = {
  registerValidator,
  loginValidator,
  bookingValidator,
  barberValidator,
};