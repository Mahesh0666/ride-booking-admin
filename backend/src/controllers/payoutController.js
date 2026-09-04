const Razorpay = require('razorpay');
const Payout = require('../models/Payout');
const User = require('../models/User');
const Ride = require('../models/Ride');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const requestPayout = async (req, res, next) => {
  const { amount, method, bankDetails, upiId } = req.body;

  try {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: { message: 'Invalid amount' } });
    }

    const user = await User.findById(req.user._id);
    if (parsedAmount > (user.earnings || 0)) {
      return res.status(400).json({ error: { message: 'Insufficient earnings balance' } });
    }

    if (parsedAmount < 100) {
      return res.status(400).json({ error: { message: 'Minimum payout is ₹100' } });
    }

    if (method === 'bank_transfer' && (!bankDetails?.accountNumber || !bankDetails?.ifscCode)) {
      return res.status(400).json({ error: { message: 'Bank details are required' } });
    }

    if (method === 'upi' && !upiId) {
      return res.status(400).json({ error: { message: 'UPI ID is required' } });
    }

    const recentRides = await Ride.find({
      driver: req.user._id,
      status: 'completed',
      payoutId: { $exists: false },
    }).sort({ completedAt: -1 });

    const payout = await Payout.create({
      driver: req.user._id,
      amount: parsedAmount,
      method: method || 'bank_transfer',
      bankDetails: method === 'bank_transfer' ? bankDetails : undefined,
      upiId: method === 'upi' ? upiId : undefined,
      rides: recentRides.map((r) => r._id),
      totalEarnings: parsedAmount,
      platformCommission: 0,
    });

    user.earnings = (user.earnings || 0) - parsedAmount;
    await user.save();

    if (global.io) {
      global.io.to('admin').emit('payout_request', {
        payoutId: payout._id,
        driverName: user.name,
        amount: parsedAmount,
        method,
        timestamp: payout.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      payout,
      message: 'Payout request submitted. It will be processed within 24-48 hours.',
    });
  } catch (err) {
    next(err);
  }
};

const getMyPayouts = async (req, res, next) => {
  try {
    const payouts = await Payout.find({ driver: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const totalPaid = await Payout.aggregate([
      { $match: { driver: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      count: payouts.length,
      totalPaid: totalPaid[0]?.total || 0,
      payouts,
    });
  } catch (err) {
    next(err);
  }
};

const getAllPayouts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};

    const payouts = await Payout.find(query)
      .populate('driver', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payout.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payouts.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      payouts,
    });
  } catch (err) {
    next(err);
  }
};

const processPayout = async (req, res, next) => {
  const { payoutId } = req.params;
  const { action } = req.body;

  try {
    const payout = await Payout.findById(payoutId).populate('driver', 'name email phone razorpayAccountId');
    if (!payout) {
      return res.status(404).json({ error: { message: 'Payout not found' } });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({ error: { message: 'Payout already processed' } });
    }

    if (action === 'reject') {
      payout.status = 'failed';
      payout.failureReason = req.body.reason || 'Rejected by admin';
      payout.processedBy = req.user._id;
      await payout.save();

      const user = await User.findById(payout.driver._id);
      user.earnings = (user.earnings || 0) + payout.amount;
      await user.save();

      if (global.io) {
        global.io.to(`driver_${payout.driver._id}`).emit('payout_failed', {
          payoutId: payout._id,
          amount: payout.amount,
          reason: payout.failureReason,
        });
      }

      return res.status(200).json({ success: true, message: 'Payout rejected' });
    }

    payout.status = 'processing';
    await payout.save();

    try {
      const transfer = await razorpay.transfers.create({
        account: payout.driver.razorpayAccountId || '',
        amount: Math.round(payout.amount * 100),
        currency: 'INR',
        notes: { payoutId: payout._id.toString() },
      });

      payout.razorpayTransferId = transfer.id;
      payout.status = 'completed';
      payout.paidAt = new Date();
      payout.processedBy = req.user._id;
      await payout.save();

      await Ride.updateMany(
        { _id: { $in: payout.rides } },
        { $set: { payoutId: payout._id } }
      );

      if (global.io) {
        global.io.to(`driver_${payout.driver._id}`).emit('payout_completed', {
          payoutId: payout._id,
          amount: payout.amount,
          paidAt: payout.paidAt,
        });
      }

      res.status(200).json({ success: true, message: 'Payout processed successfully' });
    } catch (transferErr) {
      logger.error('Razorpay transfer failed:', transferErr.message);
      payout.status = 'failed';
      payout.failureReason = transferErr.message;
      await payout.save();

      const user = await User.findById(payout.driver._id);
      user.earnings = (user.earnings || 0) + payout.amount;
      await user.save();

      res.status(500).json({ error: { message: 'Payment transfer failed' } });
    }
  } catch (err) {
    next(err);
  }
};

const getDriverEarnings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('earnings');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarnings = await Ride.aggregate([
      {
        $match: {
          driver: req.user._id,
          status: 'completed',
          completedAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$fare' },
          count: { $sum: 1 },
        },
      },
    ]);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEarnings = await Ride.aggregate([
      {
        $match: {
          driver: req.user._id,
          status: 'completed',
          completedAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$fare' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      balance: user.earnings || 0,
      today: {
        earnings: todayEarnings[0]?.total || 0,
        rides: todayEarnings[0]?.count || 0,
      },
      thisWeek: {
        earnings: weekEarnings[0]?.total || 0,
        rides: weekEarnings[0]?.count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requestPayout,
  getMyPayouts,
  getAllPayouts,
  processPayout,
  getDriverEarnings,
};
