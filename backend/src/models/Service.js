const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      default: '🚗',
    },
    vehicleType: {
      type: String,
      enum: ['auto'],
      default: 'auto',
    },
    seats: {
      type: Number,
      default: 4,
    },
    capacity: {
      type: String,
      default: '4 seats',
    },
    baseFare: {
      type: Number,
      required: true,
      default: 2.0,
    },
    perKm: {
      type: Number,
      required: true,
      default: 0.8,
    },
    perMin: {
      type: Number,
      required: true,
      default: 0.3,
    },
    minFare: {
      type: Number,
      default: 5.0,
    },
    commissionRate: {
      type: Number,
      default: 0.10,
    },
    surgeEnabled: {
      type: Boolean,
      default: true,
    },
    surgeMin: {
      type: Number,
      default: 1.0,
    },
    surgeMax: {
      type: Number,
      default: 3.0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);