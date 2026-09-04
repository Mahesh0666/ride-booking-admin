const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWallet,
  createWalletOrder,
  verifyWalletPayment,
  setDefaultPaymentMethod,
  getPaymentMethods,
  getReceipts,
} = require('../controllers/walletController');

router.use(protect);

router.route('/')
  .get(getWallet);

router.route('/create-order')
  .post(createWalletOrder);

router.route('/verify')
  .post(verifyWalletPayment);

router.route('/payment-method')
  .get(getPaymentMethods)
  .put(setDefaultPaymentMethod);

router.route('/receipts')
  .get(getReceipts);

module.exports = router;
