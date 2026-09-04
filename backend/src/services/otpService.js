const crypto = require('crypto');
const OtpVerification = require('../models/OtpVerification');
const config = require('../config/config');
const { getProvider, maskPhone } = require('./otpProviders');

class OtpServiceError extends Error {
  constructor(message, statusCode = 400, code = 'OTP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');

const validators = {
  phone(phone) {
    if (!phone) {
      throw new OtpServiceError('Enter your phone number', 400, 'PHONE_REQUIRED');
    }
    if (!/^\d{10}$/.test(phone)) {
      throw new OtpServiceError('Enter a valid 10-digit phone number', 400, 'PHONE_INVALID');
    }
  },
  role(role) {
    if (!['rider', 'driver'].includes(role)) {
      throw new OtpServiceError('Invalid account type', 400, 'ROLE_INVALID');
    }
  },
  otp(otp) {
    if (!otp || !/^\d{4,9}$/.test(String(otp))) {
      throw new OtpServiceError('Invalid OTP', 400, 'OTP_INVALID');
    }
  },
};

async function requestOtp({ phone, role = 'rider', ip } = {}) {
  const cleanPhone = normalizePhone(phone);
  validators.phone(cleanPhone);
  validators.role(role);

  const windowStart = new Date(Date.now() - config.otp.maxRequestsPerPhoneMinutes * 60 * 1000);

  const recent = await OtpVerification.find({
    phone: cleanPhone,
    createdAt: { $gte: windowStart },
  }).sort({ createdAt: -1 });

  if (recent.length >= config.otp.maxRequestsPerPhone) {
    throw new OtpServiceError(
      'Too many OTP requests. Please try again later.',
      429,
      'OTP_PHONE_LIMIT'
    );
  }

  const previous = await OtpVerification.findOne({ phone: cleanPhone, role }).sort({ createdAt: -1 });

  if (previous && Date.now() - new Date(previous.lastRequestedAt).getTime() < config.otp.resendCooldownSeconds * 1000) {
    const waitSeconds = Math.max(
      1,
      Math.ceil(
        (config.otp.resendCooldownSeconds * 1000 - (Date.now() - new Date(previous.lastRequestedAt).getTime())) / 1000
      )
    );
    throw new OtpServiceError(`Please wait ${waitSeconds}s before requesting another OTP.`, 429, 'OTP_COOLDOWN');
  }

  if (previous && previous.resendCount >= config.otp.maxResends) {
    throw new OtpServiceError('Too many OTP requests. Please try again later.', 429, 'OTP_RESEND_LIMIT');
  }

  await OtpVerification.updateMany(
    { phone: cleanPhone, role },
    { status: 'invalidated' }
  ).exec();

  const provider = getProvider();
  const sent = await provider.sendOtp({
    phone: cleanPhone,
    length: config.otp.length,
    ttlSeconds: config.otp.ttlSeconds,
    ip,
  });

  const record = await OtpVerification.create({
    phone: cleanPhone,
    role,
    requestId: sent.requestId || crypto.randomBytes(8).toString('hex'),
    reference: sent.reference || null,
    provider: sent.provider || provider.name,
    expiresAt: new Date(Date.now() + config.otp.ttlSeconds * 1000),
    resendCount: previous ? previous.resendCount + 1 : 0,
    lastRequestedAt: new Date(),
    status: 'pending',
    ipAddress: ip,
  });

  return {
    requestId: record.requestId,
    provider: record.provider,
    expiresInSeconds: config.otp.ttlSeconds,
  };
}

async function verifyOtp({ phone, role = 'rider', otp, ip } = {}) {
  const cleanPhone = normalizePhone(phone);
  validators.phone(cleanPhone);
  validators.role(role);
  validators.otp(otp);

  const record = await OtpVerification.findOne({ phone: cleanPhone, role }).sort({ createdAt: -1 });

  if (!record || (record.status !== 'pending' && record.status !== 'verified')) {
    throw new OtpServiceError('Invalid OTP', 400, 'OTP_NOT_FOUND');
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    record.status = 'invalidated';
    await record.save();
    throw new OtpServiceError('OTP expired. Please request a new OTP.', 400, 'OTP_EXPIRED');
  }

  if (record.attempts >= config.otp.maxAttempts) {
    record.status = 'invalidated';
    await record.save();
    throw new OtpServiceError('Too many attempts. Please request a new OTP.', 429, 'OTP_ATTEMPTS_EXCEEDED');
  }

  const provider = getProvider();
  const result = await provider.verifyOtp({
    phone: cleanPhone,
    otp,
    requestId: record.requestId,
    reference: record.reference,
  });

  if (!result.verified) {
    record.attempts += 1;
    if (record.attempts >= config.otp.maxAttempts) {
      record.status = 'invalidated';
    }
    await record.save();
    throw new OtpServiceError('Incorrect OTP. Please try again.', 400, 'OTP_INCORRECT');
  }

  record.status = 'verified';
  record.verifiedAt = new Date();
  await record.save();

  return {
    requestId: record.requestId,
    verified: true,
  };
}

async function consume(phone, role = 'rider') {
  const cleanPhone = normalizePhone(phone);
  const record = await OtpVerification.findOne({
    phone: cleanPhone,
    role,
    status: 'verified',
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new OtpServiceError('Please verify your OTP before continuing.', 400, 'OTP_NOT_VERIFIED');
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    record.status = 'invalidated';
    await record.save();
    throw new OtpServiceError('OTP expired. Please request a new OTP.', 400, 'OTP_EXPIRED');
  }

  record.status = 'consumed';
  await record.save();
  return { requestId: record.requestId };
}

module.exports = {
  requestOtp,
  verifyOtp,
  consume,
  OtpServiceError,
  maskPhone,
  normalizePhone,
};