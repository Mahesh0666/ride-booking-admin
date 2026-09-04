const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['bank_transfer', 'upi'],
      default: 'bank_transfer',
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String,
    },
    upiId: String,
    razorpayTransferId: String,
    razorpayAccountId: String,
    failureReason: String,
    paidAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rides: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
    }],
    totalEarnings: Number,
    platformCommission: Number,
  },
  { timestamps: true }
);

payoutSchema.index({ driver: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });

module.exports = mongoose.model('Payout', payoutSchema);
