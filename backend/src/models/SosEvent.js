const mongoose = require('mongoose');

const sosEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
    },
    type: {
      type: String,
      enum: ['sos', 'share_location'],
      default: 'sos',
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: String,
    },
    message: {
      type: String,
      default: 'Emergency SOS triggered',
    },
    notifiedContacts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyContact',
    }],
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

sosEventSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SosEvent', sosEventSchema);
