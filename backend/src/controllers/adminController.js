const User = require('../models/User');
const Ride = require('../models/Ride');
const Payment = require('../models/Payment');
const { createNotification } = require('./notificationController');

const getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: 'driver', isDriver: true })
      .populate('vehicle')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (err) {
    next(err);
  }
};

const reviewDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        error: { message: "Action must be 'approve' or 'reject'" },
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        error: { message: 'Driver not found' },
      });
    }

    if (action === 'approve') {
      user.onboardingStatus = 'approved';
      user.isVerified = true;
      user.rejectionReason = undefined;
    } else {
      user.onboardingStatus = 'rejected';
      user.isVerified = false;
      user.rejectionReason = reason || 'Documents did not meet requirements';
    }

    await user.save();

    createNotification({
      userId: user._id,
      type: 'account',
      title: action === 'approve' ? 'Profile approved 🎉' : 'Profile rejected',
      message:
        action === 'approve'
          ? 'Congratulations! Your documents were approved. You can now go online and accept rides.'
          : `Your documents were rejected. Reason: ${user.rejectionReason}. Please resubmit your details.`,
      data: { onboardingStatus: user.onboardingStatus },
    });

    if (global.io) {
      global.io.to(`user_${user._id}`).emit('user_updated', user);
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('vehicle')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isVerified, isOnline, isDriver } = req.body;

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    if (isVerified !== undefined) user.isVerified = isVerified;
    if (isOnline !== undefined) user.isOnline = isOnline;
    if (isDriver !== undefined) user.isDriver = isDriver;

    await user.save();

    if (global.io) {
      global.io.to(`user_${user._id}`).emit('user_updated', user);
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

const getRideStats = async (req, res, next) => {
  try {
    const totalRides = await Ride.countDocuments();
    const totalUsers = await User.countDocuments();
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    const cancelledRides = await Ride.countDocuments({ status: 'cancelled' });
    const requestedRides = await Ride.countDocuments({ status: 'requested' });
    const activeRides = await Ride.countDocuments({
      status: { $in: ['accepted', 'arriving', 'in_progress'] },
    });

    const activeDrivers = await User.countDocuments({
      role: 'driver',
      isOnline: true,
    });

    const totalRevenue = await Ride.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);

    const totalEarnings = await Ride.aggregate([
      { $match: { status: 'completed' } },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'ride',
          as: 'payment',
        },
      },
      { $unwind: '$payment' },
      { $group: { _id: null, total: { $sum: '$payment.commission' } } },
    ]);

    const recentRides = await Ride.find()
      .populate('rider', 'name email')
      .populate('driver', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalRides,
        totalUsers,
        completedRides,
        cancelledRides,
        requestedRides,
        activeRides,
        activeDrivers,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalEarnings: totalEarnings[0]?.total || 0,
      },
      recentRides,
    });
  } catch (err) {
    next(err);
  }
};

const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('ride')
      .populate('rider', 'name email')
      .populate('driver', 'name email')
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

const getAllRides = async (req, res, next) => {
  try {
    const rides = await Ride.find()
      .populate('rider', 'name email')
      .populate('driver', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

const deleteDriver = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: { message: 'Driver not found' } });
    }
    res.status(200).json({ success: true, message: 'Driver deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUserStatus,
  getRideStats,
  getAllDrivers,
  reviewDriver,
  getAllPayments,
  getAllRides,
  deleteUser,
  deleteDriver,
};