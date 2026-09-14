const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { verifyAccessToken } = require('../utils/generateToken');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: { message: 'Not authorized to access this route' },
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: { message: 'Account no longer exists' },
      });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { message: 'Token expired', code: 'TOKEN_EXPIRED' },
      });
    }
    return res.status(401).json({
      error: { message: 'Not authorized to access this route' },
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: 'Not authorized to access this route' },
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: `User role ${req.user.role} is not authorized to access this route`,
        },
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
