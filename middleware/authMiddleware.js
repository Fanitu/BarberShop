const jwt = require('jsonwebtoken');
const User = require('../Users/usersModel/userModel');
const { secret } = require('../config/jwtConfig');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Continue without user if token is invalid
    }
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };