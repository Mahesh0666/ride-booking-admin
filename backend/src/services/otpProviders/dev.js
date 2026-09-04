const crypto = require('crypto');
const config = require('../../config/config');

const maskPhone = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
};

const generateOtp = (length) => {
  const size = Math.min(Math.max(length || config.otp.length, 4), 9);
  const min = Math.pow(10, size - 1);
  const max = Math.pow(10, size) - 1;
  return String(crypto.randomInt(min, max + 1));
};

const hashOtp = (otp) => {
  return crypto.createHmac('sha256', config.jwtSecret).update(String(otp)).digest('hex');
};

const sendOtp = async ({ phone, length, ttlSeconds, ip }) => {
  const otp = '1234';
  // eslint-disable-next-line no-console
  console.log(`[dev-otp] ${maskPhone(phone)} -> ${otp}`);
  return {
    provider: 'dev',
    requestId: crypto.randomBytes(8).toString('hex'),
    reference: hashOtp(otp),
  };
};

const verifyOtp = async ({ phone, otp, requestId, reference }) => {
  const expected = Buffer.from(String(reference || ''), 'hex');
  const actual = Buffer.from(hashOtp(String(otp).trim()), 'hex');
  const verified = Boolean(
    reference && expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  );
  return {
    verified,
    message: verified ? 'OTP verified successfully' : 'OTP verification failed',
    requestId,
  };
};

module.exports = {
  name: 'dev',
  maskPhone,
  toE164: (phone) => `${config.otp.countryCode}${String(phone).replace(/\D/g, '')}`,
  sendOtp,
  verifyOtp,
};