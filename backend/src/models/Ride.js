const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: String,
    },
    dropoffLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: String,
    },
    status: {
      type: String,
      enum: ['scheduled', 'requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled', 'failed'],
      default: 'requested',
      index: true,
    },
    scheduledAt: Date,
    isScheduled: {
      type: Boolean,
      default: false,
    },
    fare: {
      type: Number,
    },
    distance: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    vehicleType: {
      type: String,
      enum: ['auto', 'sedan_basic', 'sedan_comfort', 'suv', 'mvp'],
      default: 'auto',
    },
    tip: {
      type: Number,
      default: 0,
    },
    commission: {
      type: Number,
      default: 0,
    },
    commissionBy: {
      type: String,
      enum: ['platform', 'driver', 'rider'],
      default: 'platform',
    },
    commissionPaidAt: Date,
    commissionOutstanding: {
      type: Number,
      default: 0,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    driverLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    estimatedArrival: {
      type: Number,
    },
    acceptedAt: Date,
    arrivingAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    cancellationBy: {
      type: String,
      enum: ['rider', 'driver', 'system'],
    },
    cancellationFee: {
      type: Number,
      default: 0,
    },
    rating: {
      rated: { type: Boolean, default: false },
      score: { type: Number, min: 1, max: 5 },
      comment: String,
    },
    otp: {
      type: String,
      select: true,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payout',
    },
  },
  { timestamps: true }
);

rideSchema.index({ pickupLocation: '2dsphere' });
rideSchema.index({ dropoffLocation: '2dsphere' });
rideSchema.index({ driverLocation: '2dsphere' });
rideSchema.index({ rider: 1, status: 1 });
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Ride', rideSchema);
