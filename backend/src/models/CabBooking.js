const mongoose = require('mongoose');

const cabBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pickup: {
    address: String,
    latitude: Number,
    longitude: Number,
  },
  dropoff: {
    address: String,
    latitude: Number,
    longitude: Number,
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['sedan_basic', 'sedan_comfort', 'suv', 'mvp'],
  },
  seats: {
    type: Number,
    required: true,
  },
  distanceKm: {
    type: Number,
    required: true,
  },
  fare: {
    type: Number,
    required: true,
  },
  travelDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  adminNote: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

cabBookingSchema.index({ createdAt: -1 });
cabBookingSchema.index({ user: 1, createdAt: -1 });
cabBookingSchema.index({ status: 1 });

module.exports = mongoose.model('CabBooking', cabBookingSchema);
