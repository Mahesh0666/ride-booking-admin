const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  logger.info(`[AUTH] Route: ${req.originalUrl} | Token present: ${!!token}`);

  if (!token) {
    logger.warn(`[AUTH] No token. Headers: ${JSON.stringify(Object.keys(req.headers))}`);
    return res.status(401).json({
      error: { message: 'Not authorized to access this route' },
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    logger.info(`[AUTH] Token decoded. User ID: ${decoded.id}`);
    const user = await User.findById(decoded.id);
    if (!user) {
      logger.warn(`[AUTH] User not found for ID: ${decoded.id}`);
      return res.status(401).json({
        error: { message: 'Account no longer exists' },
      });
    }
    logger.info(`[AUTH] User found: ${user.name} role: ${user.role}`);
    req.user = user;
    next();
  } catch (err) {
    logger.error(`[AUTH] Token verify failed: ${err.message}`);
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
