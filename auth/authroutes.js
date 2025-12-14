const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  refreshToken 
} = require('./authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidator, loginValidator } = require('../utils/validatore');
const { validate } = require('../middleware/validationMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerValidator, register);
router.post('/login', authLimiter, loginValidator,login);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);

module.exports = router;