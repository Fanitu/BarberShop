const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  };
};

const validateBooking = (req, res, next) => {
  const { barberId, date, startTime, service } = req.body;
  
  if (!barberId || !date || !startTime || !service) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: barberId, date, startTime, service'
    });
  }
  
  next();
};

module.exports = { validate, validateBooking };