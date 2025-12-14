const User = require('../Users/usersModel/userModel');
const jwt = require('jsonwebtoken');
const { secret, expiresIn, refreshSecret, refreshExpiresIn } = require('../config/jwtConfig');
const { sendWelcomeEmail } = require('../service/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, secret, {
    expiresIn: expiresIn,
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, refreshSecret, {
    expiresIn: refreshExpiresIn,
  });
};

const sendWelcomeEmailToUser = async (user) => {
  try {
    await sendWelcomeEmail({
      name: user.name,
      email: user.email,
      dashboardUrl: `${process.env.CLIENT_URL}/dashboard`,
    });
    console.log(`✅ Welcome email sent to ${user.email}`);
  } catch (error) {
    // Don't fail registration if email fails
    console.error(`❌ Failed to send welcome email to ${user.email}:`, error.message);
    // You might want to log this to a monitoring service
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'client',
    });

     // 🎯 NEW: Send welcome email (non-blocking)
    if (user.role === 'client') {
      console.log(user.role)
      // Send email in background, don't wait for it
      sendWelcomeEmailToUser(user).catch(err => {
        console.error('Background email error:', err.message);
      });

      console.log('done');
    }


    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    console.log(user);

   
    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      message: user.role === 'client' 
        ? 'Registration successful! Welcome email sent.' 
        : 'Registration successful!',
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
    }

    const decoded = jwt.verify(refreshToken, refreshSecret);
    const newToken = generateToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};