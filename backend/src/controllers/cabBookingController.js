const CabBooking = require('../models/CabBooking');
const User = require('../models/User');
const { sendCabBookingEmail } = require('../services/emailService');
const logger = require('../utils/logger');

const VEHICLE_SEATS = {
  sedan_basic: 4,
  sedan_comfort: 4,
  suv: 6,
  mvp: 7,
};

const createCabBooking = async (req, res, next) => {
  try {
    const { pickup, dropoff, vehicleType, distanceKm, fare, travelDate } = req.body;

    if (!pickup || !dropoff || !vehicleType || !distanceKm || !fare || !travelDate) {
      return res.status(400).json({ error: { message: 'All fields are required' } });
    }

    const booking = await CabBooking.create({
      user: req.user._id,
      pickup: {
        address: pickup.address,
        latitude: pickup.latitude,
        longitude: pickup.longitude,
      },
      dropoff: {
        address: dropoff.address,
        latitude: dropoff.latitude,
        longitude: dropoff.longitude,
      },
      vehicleType,
      seats: VEHICLE_SEATS[vehicleType] || 4,
      distanceKm,
      fare,
      travelDate: new Date(travelDate),
      status: 'pending',
    });

    const populated = await CabBooking.findById(booking._id).populate('user', 'name phone email');

    // Send email to admin (fire and forget)
    sendCabBookingEmail(populated, populated.user).catch((err) =>
      logger.error(`Email send failed: ${err.message}`)
    );

    res.status(201).json({
      success: true,
      message: 'Booking confirmed! We will get connected to you soon.',
      booking: populated,
    });
  } catch (err) {
    next(err);
  }
};

const getMyCabBookings = async (req, res, next) => {
  try {
    const bookings = await CabBooking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
};

const getAllCabBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const bookings = await CabBooking.find(query)
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CabBooking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const { createNotification } = require('./notificationController');

const updateCabBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote, assignedDriver } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    if (assignedDriver && (assignedDriver.name || assignedDriver.phone)) {
      updateData.assignedDriver = {
        name: assignedDriver.name || '',
        phone: assignedDriver.phone || '',
        vehicleNumber: assignedDriver.vehicleNumber || '',
        vehicleModel: assignedDriver.vehicleModel || '',
        assignedAt: new Date(),
      };
      if (!status || status === 'pending') {
        updateData.status = 'confirmed';
      }
    }

    const booking = await CabBooking.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'name phone email');

    if (!booking) {
      return res.status(404).json({ error: { message: 'Booking not found' } });
    }

    // Real-time update to user via socket
    if (global.io && booking.user?._id) {
      const userIdStr = booking.user._id.toString();
      global.io.to(`user_${userIdStr}`).emit('cab_booking_updated', booking);
    }

    // Notification to user
    if (booking.user?._id) {
      const driverName = booking.assignedDriver?.name || 'a driver';
      createNotification({
        userId: booking.user._id,
        type: 'cab',
        title: booking.assignedDriver?.name ? 'Cab Driver Assigned!' : 'Cab Booking Updated',
        message: booking.assignedDriver?.name
          ? `Driver ${driverName} (${booking.assignedDriver.vehicleNumber || 'Cab'}) has been assigned to your booking.`
          : `Your cab booking status has been updated to ${booking.status}.`,
        data: { bookingId: booking._id, status: booking.status },
      }).catch(() => {});
    }

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

const getCabBookingStats = async (req, res, next) => {
  try {
    const total = await CabBooking.countDocuments();
    const pending = await CabBooking.countDocuments({ status: 'pending' });
    const confirmed = await CabBooking.countDocuments({ status: 'confirmed' });
    const completed = await CabBooking.countDocuments({ status: 'completed' });
    const cancelled = await CabBooking.countDocuments({ status: 'cancelled' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await CabBooking.countDocuments({ createdAt: { $gte: today } });

    const revenueResult = await CabBooking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      success: true,
      stats: { total, pending, confirmed, completed, cancelled, todayCount, totalRevenue },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCabBooking,
  getMyCabBookings,
  getAllCabBookings,
  updateCabBookingStatus,
  getCabBookingStats,
};
