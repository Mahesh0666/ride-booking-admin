const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  requestRide,
  getRide,
  getMyRides,
  acceptRide,
  verifyRideOtp,
  updateRideStatus,
  cancelRide,
  rateRide,
  estimateFare,
} = require('../controllers/rideController');

router.route('/estimate')
  .get(estimateFare);

router.use(protect);

router.route('/')
  .post(requestRide)
  .get(getMyRides);

router.route('/:rideId')
  .get(getRide);

router.route('/:rideId/cancel')
  .post(cancelRide);

router.route('/:rideId/rate')
  .post(rateRide);

router.use(authorize('driver'));

router.route('/:rideId/accept')
  .post(acceptRide);

router.route('/:rideId/verify-otp')
  .post(verifyRideOtp);

router.route('/:rideId/status')
  .put(updateRideStatus);

module.exports = router;