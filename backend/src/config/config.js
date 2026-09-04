require('dotenv').config();

const defaultOtpLength = parseInt(process.env.OTP_LENGTH || '6', 10);

module.exports = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  stripeKey: process.env.STRIPE_SECRET_KEY,
  googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  otp: {
    provider: process.env.OTP_PROVIDER || 'dev',
    length: Math.min(Math.max(defaultOtpLength, 4), 9),
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS || '300', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    maxResends: parseInt(process.env.OTP_MAX_RESENDS || '3', 10),
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '30', 10),
    maxRequestsPerPhoneMinutes: parseInt(process.env.OTP_MAX_REQUESTS_PER_PHONE_MINUTES || '15', 10),
    maxRequestsPerPhone: parseInt(process.env.OTP_MAX_REQUESTS_PER_PHONE || '5', 10),
    countryCode: process.env.COUNTRY_CODE || '91',
    msg91: {
      authKey: process.env.MSG91_AUTH_KEY,
      senderId: process.env.MSG91_SENDER_ID,
      templateId: process.env.MSG91_TEMPLATE_ID,
      baseUrl: process.env.MSG91_BASE_URL || 'https://control.msg91.com',
    },
  },
};