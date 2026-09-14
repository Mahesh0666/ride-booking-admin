const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['rider', 'driver', 'admin'],
      default: 'rider',
    },
    adminRole: {
      type: String,
      enum: ['super_admin', 'operations', 'support', 'finance', 'driver_verification'],
      default: 'super_admin',
    },
    profileImage: {
      type: String,
    },
    // Driver-specific fields
    isDriver: {
      type: Boolean,
      default: false,
    },
    licenseNumber: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    onboardingStatus: {
      type: String,
      enum: ['not_started', 'submitted', 'approved', 'rejected'],
      default: 'not_started',
    },
    rejectionReason: String,
    documents: {
      licenseImage: String,
      registrationImage: String,
      insuranceImage: String,
      profileImage: String,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastLocationAt: {
      type: Date,
    },
    currentLocation: {
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
    rating: {
      type: Number,
      default: 0,
    },
    totalRides: {
      type: Number,
      default: 0,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    earnings: {
      type: Number,
      default: 0,
    },
    stripeAccountId: String,
    razorpayAccountId: String,
    // Wallet & payments
    walletBalance: {
      type: Number,
      default: 0,
    },
    defaultPaymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'wallet'],
      default: 'cash',
    },
    fcmToken: {
      type: String,
      select: false,
    },
    savedAddresses: [
      {
        label: {
          type: String,
          enum: ['Home', 'Work', 'Other'],
          default: 'Other',
        },
        address: {
          type: String,
          required: true,
        },
        latitude: Number,
        longitude: Number,
        isFavorite: {
          type: Boolean,
          default: false,
        },
      },
    ],
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    loginOtp: {
      type: String,
      select: false,
    },
    loginOtpExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ currentLocation: '2dsphere' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toProfileJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    profileImage: this.profileImage,
    isDriver: this.isDriver,
    isOnline: this.isOnline,
    isVerified: this.isVerified,
    onboardingStatus: this.onboardingStatus,
    rejectionReason: this.rejectionReason,
    licenseNumber: this.licenseNumber,
    documents: this.documents || {},
    rating: this.rating,
    totalRides: this.totalRides,
    earnings: this.earnings,
    currentLocation: this.currentLocation,
    vehicle: this.vehicle,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);