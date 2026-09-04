const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCabBooking,
  getMyCabBookings,
  getAllCabBookings,
  updateCabBookingStatus,
  getCabBookingStats,
} = require('../controllers/cabBookingController');

// User routes
router.post('/', protect, createCabBooking);
router.get('/my', protect, getMyCabBookings);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllCabBookings);
router.get('/admin/stats', protect, authorize('admin'), getCabBookingStats);
router.put('/admin/:id/status', protect, authorize('admin'), updateCabBookingStatus);

module.exports = router;
