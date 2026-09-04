const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

const keyGenerator = ipKeyGenerator();

const standardHeaders = true;
const legacyHeaders = false;

const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator,
  standardHeaders,
  legacyHeaders,
  handler: (req, res) => {
    return res.status(429).json({
      error: { message: 'Too many OTP requests from this device. Please try again later.' },
    });
  },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyGenerator,
  standardHeaders,
  legacyHeaders,
  handler: (req, res) => {
    return res.status(429).json({
      error: { message: 'Too many verification attempts. Please try again later.' },
    });
  },
});

module.exports = {
  otpRequestLimiter,
  otpVerifyLimiter,
};