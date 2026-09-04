const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createOrder,
  verifyPayment,
  getPaymentByRide,
  getMyPayments,
} = require('../controllers/paymentController');

router.use(protect);

router.route('/create-order')
  .post(createOrder);

router.route('/verify')
  .post(verifyPayment);

router.route('/my-payments')
  .get(getMyPayments);

router.route('/ride/:rideId')
  .get(getPaymentByRide);

module.exports = router;
