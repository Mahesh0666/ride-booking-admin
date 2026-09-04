const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      enum: ['family', 'friend', 'other'],
      default: 'other',
    },
  },
  { timestamps: true }
);

emergencyContactSchema.index({ user: 1 });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
