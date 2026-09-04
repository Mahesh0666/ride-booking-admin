const crypto = require('crypto');
const Razorpay = require('razorpay');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Payment = require('../models/Payment');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getWallet = async (req, res, next) => {
  try {
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      balance: req.user.walletBalance || 0,
      defaultPaymentMethod: req.user.defaultPaymentMethod || 'cash',
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

const createWalletOrder = async (req, res, next) => {
  const { amount } = req.body;

  try {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || parsedAmount > 100000) {
      return res.status(400).json({ error: { message: 'Invalid amount (max ₹1,00,000)' } });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(parsedAmount * 100),
      currency: 'INR',
      receipt: `wallet_${req.user._id}_${Date.now()}`,
      notes: { userId: req.user._id.toString(), type: 'wallet_recharge' },
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: Math.round(parsedAmount * 100),
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
};

const verifyWalletPayment = async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: { message: 'Payment verification failed' } });
    }

    const parsedAmount = parseFloat(amount) / 100;

    const user = await User.findById(req.user._id);
    user.walletBalance = (user.walletBalance || 0) + parsedAmount;
    await user.save();

    const transaction = await WalletTransaction.create({
      user: user._id,
      type: 'credit',
      source: 'recharge',
      amount: parsedAmount,
      balanceAfter: user.walletBalance,
      description: 'Wallet recharge via Razorpay',
      meta: { razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id },
    });

    res.status(200).json({
      success: true,
      balance: user.walletBalance,
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

const setDefaultPaymentMethod = async (req, res, next) => {
  const { method } = req.body;

  try {
    if (!['cash', 'upi', 'card', 'wallet'].includes(method)) {
      return res.status(400).json({ error: { message: 'Invalid payment method' } });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { defaultPaymentMethod: method },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      defaultPaymentMethod: user.defaultPaymentMethod,
    });
  } catch (err) {
    next(err);
  }
};

const getPaymentMethods = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      defaultPaymentMethod: user.defaultPaymentMethod || 'cash',
    });
  } catch (err) {
    next(err);
  }
};

const getReceipts = async (req, res, next) => {
  try {
    const payments = await Payment.find({ rider: req.user._id })
      .populate('ride')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWallet,
  createWalletOrder,
  verifyWalletPayment,
  setDefaultPaymentMethod,
  getPaymentMethods,
  getReceipts,
};
