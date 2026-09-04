const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { otpRequestLimiter, otpVerifyLimiter } = require('../middleware/rateLimiters');
const {
  register,
  login,
  requestOtp,
  verifyOtp,
  otpRegister,
  submitOnboarding,
  getOnboardingStatus,
  getMe,
  updateProfile,
  updateOnlineStatus,
  updateLocation,
  getNearbyDrivers,
  deleteAccount,
  updateFcmToken,
  changeCredentials,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  adminLoginRequestOtp,
  adminLoginVerifyOtp,
  seedAdminUser,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login-request-otp', adminLoginRequestOtp);
router.post('/admin/login-verify-otp', adminLoginVerifyOtp);
router.post('/otp/request', otpRequestLimiter, requestOtp);
router.post('/otp/verify', otpVerifyLimiter, verifyOtp);
router.post('/otp/register', otpVerifyLimiter, otpRegister);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.post('/seed-admin', seedAdminUser);

router.use(protect);

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/online-status', updateOnlineStatus);
router.put('/location', updateLocation);
router.get('/nearby-drivers', getNearbyDrivers);
router.post('/driver/onboarding', submitOnboarding);
router.get('/driver/onboarding-status', getOnboardingStatus);
router.delete('/account', deleteAccount);
router.post('/fcm-token', updateFcmToken);
router.put('/change-credentials', changeCredentials);

module.exports = router;