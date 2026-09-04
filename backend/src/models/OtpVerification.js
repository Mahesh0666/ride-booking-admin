const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['rider', 'driver'],
      required: true,
    },
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reference: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastRequestedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'consumed', 'invalidated'],
      default: 'pending',
    },
    verifiedAt: Date,
    ipAddress: String,
    provider: String,
  },
  { timestamps: true }
);

otpVerificationSchema.index({ phone: 1, role: 1, status: 1 });
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);

module.exports = OtpVerification;