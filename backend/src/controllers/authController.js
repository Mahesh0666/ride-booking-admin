const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const generateToken = require('../utils/generateToken');
const { createNotification } = require('./notificationController');
const otpService = require('../services/otpService');
const crypto = require('crypto');
let sendOtpEmail, sendPasswordChangeConfirmation, sendLoginNotification;
try {
  ({ sendOtpEmail, sendPasswordChangeConfirmation, sendLoginNotification } = require('../services/emailService'));
} catch (e) {
  console.error('Email service not loaded:', e.message);
  sendOtpEmail = async () => ({ success: false });
  sendPasswordChangeConfirmation = async () => ({ success: false });
  sendLoginNotification = async () => ({ success: false });
}

const forgotPassword = async (req, res, next) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'maheshmessi78@gmail.com';
    const user = await User.findOne({ email: adminEmail, role: 'admin' });
    if (!user) {
      return res.status(404).json({ error: { message: 'Admin account not found' } });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail(adminEmail, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to admin email',
    });
  } catch (err) {
    next(err);
  }
};

const verifyResetOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || 'maheshmessi78@gmail.com';

    if (!otp) {
      return res.status(400).json({ error: { message: 'OTP is required' } });
    }

    const user = await User.findOne({
      email: adminEmail,
      resetPasswordToken: crypto.createHash('sha256').update(otp).digest('hex'),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: { message: 'Invalid or expired OTP' } });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified. You can now set a new password.',
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || 'maheshmessi78@gmail.com';

    if (!otp || !newPassword) {
      return res.status(400).json({ error: { message: 'OTP and new password are required' } });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: { message: 'Password must be at least 6 characters' } });
    }

    const user = await User.findOne({
      email: adminEmail,
      resetPasswordToken: crypto.createHash('sha256').update(otp).digest('hex'),
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ error: { message: 'Invalid or expired OTP' } });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await sendPasswordChangeConfirmation(adminEmail).catch(() => {});

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: 'Password reset successful. Confirmation email sent.',
      token,
      user: user.toProfileJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: { message: 'User already exists with this email' },
      });
    }

    const isDriver = role === 'driver';
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'rider',
      isDriver,
      onboardingStatus: isDriver ? 'not_started' : 'approved',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: user.toProfileJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid credentials' },
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: { message: 'Invalid credentials' },
      });
    }

    user.isOnline = true;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    const populated = await User.findById(user._id).populate('vehicle');
    const profile = populated.toProfileJSON();
    profile.vehicle = populated.vehicle;

    if (user.role === 'admin') {
      const adminEmail = process.env.ADMIN_EMAIL || user.email;
      const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      let device = 'Unknown', browser = 'Unknown', os = 'Unknown';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
      else if (userAgent.includes('Edg')) browser = 'Edge';
      if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = 'Mobile';
      else device = 'Desktop';
      const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      sendLoginNotification(adminEmail, {
        ip: ip.replace('::ffff:', ''),
        device,
        browser,
        os,
        location: 'India',
        time,
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      token,
      user: profile,
    });
  } catch (err) {
    next(err);
  }
};

const submitOnboarding = async (req, res, next) => {
  try {
    const {
      licenseNumber,
      vehicleType,
      make,
      model,
      year,
      color,
      licensePlate,
      documents,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user || !user.isDriver) {
      return res.status(403).json({
        error: { message: 'Only drivers can submit onboarding' },
      });
    }

    user.licenseNumber = licenseNumber || user.licenseNumber;
    if (documents) {
      user.documents = {
        ...(user.documents || {}),
        ...documents,
      };
    }
    user.onboardingStatus = 'submitted';
    user.isVerified = false;
    user.rejectionReason = undefined;
    await user.save({ validateBeforeSave: false });

    if (make && model && licensePlate) {
      const existingVehicle = await Vehicle.findOne({ driver: user._id });
      const vehicleData = {
        driver: user._id,
        make,
        model,
        year: Number(year) || new Date().getFullYear(),
        color: color || '',
        licensePlate,
        vehicleType: vehicleType || 'auto',
      };
      if (existingVehicle) {
        await Vehicle.findByIdAndUpdate(existingVehicle._id, vehicleData, {
          new: true,
          runValidators: true,
        });
        user.vehicle = existingVehicle._id;
      } else {
        const vehicle = await Vehicle.create(vehicleData);
        user.vehicle = vehicle._id;
      }
      await user.save({ validateBeforeSave: false });
    }

    const profile = user.toProfileJSON();
    profile.vehicle = await Vehicle.findOne({ driver: user._id });

    res.status(200).json({
      success: true,
      user: profile,
    });
  } catch (err) {
    next(err);
  }
};

const getOnboardingStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('vehicle');
    res.status(200).json({
      success: true,
      status: user.onboardingStatus,
      isVerified: user.isVerified,
      rejectionReason: user.rejectionReason,
      user: user.toProfileJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const Ride = require('../models/Ride');

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: { message: 'Account not found' } });
    }

    await Ride.deleteMany({ rider: userId });
    await Ride.deleteMany({ driver: userId });
    if (user.vehicle) {
      await Vehicle.findByIdAndDelete(user.vehicle).catch(() => {});
    }
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been deleted.',
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('vehicle')
      .select('-password');

    if (!user) {
      return res.status(401).json({ error: { message: 'Account no longer exists' } });
    }

    const profile = user.toProfileJSON();
    profile.vehicle = user.vehicle;

    res.status(200).json({
      success: true,
      user: profile,
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
    };

    if (req.body.profileImage) {
      fieldsToUpdate.profileImage = req.body.profileImage;
      fieldsToUpdate.documents = {
        ...(req.user?.documents || {}),
        profileImage: req.body.profileImage,
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(401).json({ error: { message: 'Account no longer exists' } });
    }

    res.status(200).json({
      success: true,
      user: user.toProfileJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const updateOnlineStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isOnline },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user: user.toProfileJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user: user.toProfileJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const getNearbyDrivers = async (req, res, next) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;

    const drivers = await User.find({
      role: 'driver',
      isOnline: true,
      isVerified: true,
      onboardingStatus: 'approved',
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(maxDistance),
        },
      },
    }).select('name rating totalRides currentLocation vehicle');

    res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (err) {
    next(err);
  }
};

const requestOtp = async (req, res, next) => {
  try {
    const phone = String(req.body.phone || '').replace(/\D/g, '');
    const role = req.body.role || 'rider';

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: { message: 'Enter a valid 10-digit phone number' } });
    }
    if (!['rider', 'driver'].includes(role)) {
      return res.status(400).json({ error: { message: 'Invalid account type' } });
    }

    const existing = await User.findOne({ phone, role });
    const { requestId, provider, expiresInSeconds } = await otpService.requestOtp({
      phone,
      role,
      ip: req.ip,
    });

    console.log(
      `[otp] request id=${requestId} phone=${otpService.maskPhone(phone)} role=${role} provider=${provider}`
    );

    res.status(200).json({
      success: true,
      requestId,
      expiresInSeconds,
      isNewUser: !existing,
    });
  } catch (err) {
    if (err instanceof otpService.OtpServiceError) {
      return res.status(err.statusCode).json({ error: { message: err.message } });
    }
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const phone = String(req.body.phone || '').replace(/\D/g, '');
    const otp = String(req.body.otp || '');
    const role = req.body.role || 'rider';

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: { message: 'Enter a valid 10-digit phone number' } });
    }
    if (!['rider', 'driver'].includes(role)) {
      return res.status(400).json({ error: { message: 'Invalid account type' } });
    }

    const result = await otpService.verifyOtp({ phone, role, otp, ip: req.ip });

    const user = await User.findOne({ phone, role });

    if (!user) {
      return res.status(200).json({ success: true, isNewUser: true });
    }

    user.isOnline = true;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    const populated = await User.findById(user._id).populate('vehicle');
    const profile = populated.toProfileJSON();
    profile.vehicle = populated.vehicle;

    res.status(200).json({
      success: true,
      isNewUser: false,
      requestId: result.requestId,
      token,
      user: profile,
    });
  } catch (err) {
    if (err instanceof otpService.OtpServiceError) {
      return res.status(err.statusCode).json({ error: { message: err.message } });
    }
    next(err);
  }
};

const otpRegister = async (req, res, next) => {
  try {
    const phone = String(req.body.phone || '').replace(/\D/g, '');
    const name = String(req.body.name || '').trim();
    const role = req.body.role || 'rider';

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: { message: 'Enter a valid 10-digit phone number' } });
    }
    if (!name) {
      return res.status(400).json({ error: { message: 'Please enter your name' } });
    }
    if (!['rider', 'driver'].includes(role)) {
      return res.status(400).json({ error: { message: 'Invalid account type' } });
    }

    const existingUser = await User.findOne({ phone, role });
    if (existingUser) {
      return res.status(409).json({
        error: { message: 'An account already exists with this phone number. Please log in instead.' },
      });
    }

    const consumed = await otpService.consume(phone, role);

    const isDriver = role === 'driver';
    const user = await User.create({
      name,
      phone,
      email: isDriver ? `${phone}@driver.otp.local` : `${phone}@otp.local`,
      password: crypto.randomBytes(24).toString('hex'),
      role,
      isDriver,
      onboardingStatus: isDriver ? 'not_started' : 'approved',
    });

    const token = generateToken(user._id);
    const populated = await User.findById(user._id).populate('vehicle');
    const profile = populated.toProfileJSON();
    profile.vehicle = populated.vehicle;

    res.status(201).json({
      success: true,
      isNewUser: true,
      requestId: consumed.requestId,
      token,
      user: profile,
    });
  } catch (err) {
    if (err instanceof otpService.OtpServiceError) {
      return res.status(err.statusCode).json({ error: { message: err.message } });
    }
    if (err.code === 11000) {
      return res.status(409).json({
        error: { message: 'An account already exists with this phone number. Please log in instead.' },
      });
    }
    next(err);
  }
};

const updateFcmToken = async (req, res, next) => {
  const { fcmToken } = req.body;

  try {
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

const changeCredentials = async (req, res, next) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    if (currentPassword) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: { message: 'Current password is incorrect' } });
      }
    }

    if (newEmail) {
      const existing = await User.findOne({ email: newEmail });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ error: { message: 'Email already in use' } });
      }
      user.email = newEmail;
    }

    if (newPassword) {
      user.password = newPassword;
    }

    await user.save();

    const profile = user.toProfileJSON();
    res.status(200).json({
      success: true,
      message: 'Credentials updated successfully',
      user: profile,
    });
  } catch (err) {
    next(err);
  }
};

const adminLoginRequestOtp = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email and password are required' } });
    }

    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.loginOtp = crypto.createHash('sha256').update(otp).digest('hex');
    user.loginOtpExpire = Date.now() + 5 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      otp: otp,
    });
  } catch (err) {
    next(err);
  }
};

const adminLoginVerifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ error: { message: 'Email and OTP are required' } });
    }

    console.log('Verify OTP attempt:', { email, otpLength: String(otp).length });

    const hashedOtp = crypto.createHash('sha256').update(String(otp)).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      role: 'admin',
      loginOtp: hashedOtp,
      loginOtpExpire: { $gt: Date.now() },
    }).select('+password');

    console.log('User found:', !!user);

    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid or expired OTP' } });
    }

    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    user.isOnline = true;
    await user.save({ validateBeforeSave: false });

    console.log('User saved, generating token...');

    const token = generateToken(user._id);
    const profile = user.toProfileJSON();

    console.log('Sending response...');

    res.status(200).json({
      success: true,
      token,
      user: profile,
    });

    console.log('Response sent successfully');
  } catch (err) {
    console.error('Verify OTP error:', err.message, err.stack);
    next(err);
  }
};

const seedAdminUser = async (req, res, next) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'maheshmessi78@gmail.com').toLowerCase();
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      if (existing.email !== adminEmail) {
        existing.email = adminEmail;
        await existing.save({ validateBeforeSave: false });
        return res.status(200).json({ success: true, message: 'Admin email updated', email: adminEmail });
      }
      return res.status(200).json({ success: true, message: 'Admin already exists', email: adminEmail });
    }
    const admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: 'Venu@123',
      phone: '9999999999',
      role: 'admin',
      isDriver: false,
      isVerified: true,
      onboardingStatus: 'approved',
    });
    res.status(201).json({ success: true, message: 'Admin created', email: adminEmail });
  } catch (err) {
    next(err);
  }
};

const testEmail = async (req, res, next) => {
  try {
    const { sendOtpEmail } = require('../services/emailService');
    const nodemailer = require('nodemailer');
    const testOtp = '123456';
    
    const result = await sendOtpEmail('maheshmessi78@gmail.com', testOtp);
    res.status(200).json({ success: true, message: 'Test email sent', result });
  } catch (err) {
    console.error('Test email error:', err.message, err.code, err.stack);
    res.status(500).json({ success: false, message: 'Email failed', error: err.message, code: err.code });
  }
};

module.exports = {
  register,
  login,
  requestOtp,
  verifyOtp,
  otpRegister,
  submitOnboarding,
  getOnboardingStatus,
  getMe,
  updateProfile,
  updateOnlineStatus,
  updateLocation,
  getNearbyDrivers,
  deleteAccount,
  updateFcmToken,
  changeCredentials,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  adminLoginRequestOtp,
  adminLoginVerifyOtp,
  seedAdminUser,
  testEmail,
};