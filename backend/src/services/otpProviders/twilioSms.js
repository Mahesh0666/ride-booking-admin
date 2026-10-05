const crypto = require('crypto');
const config = require('../../config/config');

let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;

  const { accountSid, authToken } = config.otp.twilioSms;
  if (!accountSid || !authToken) {
    throw new Error('TWILIO_SMS_ACCOUNT_SID and TWILIO_SMS_AUTH_TOKEN must be configured');
  }

  const twilio = require('twilio');
  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

const maskPhone = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
};

const toE164 = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  return `+91${digits}`;
};

const generateCode = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(crypto.randomInt(min, max + 1));
};

const sendOtp = async ({ phone, length = 6, ttlSeconds = 300 }) => {
  const client = getClient();
  const { fromNumber } = config.otp.twilioSms;
  if (!fromNumber) {
    throw new Error('TWILIO_SMS_FROM_NUMBER must be configured');
  }

  const e164Phone = toE164(phone);
  const code = generateCode(length || 6);
  const minutes = Math.max(1, Math.round((ttlSeconds || 300) / 60));
  const body = `${code} is the OTP for verification of the app Kuppam Connect. Valid for ${minutes} minute${minutes === 1 ? '' : 's'}.`;

  console.log(`[Twilio SMS] Sending OTP to ${maskPhone(e164Phone)} from ${fromNumber}`);

  let message;
  try {
    message = await client.messages.create({
      to: e164Phone,
      from: fromNumber,
      body,
    });
  } catch (err) {
    console.error(`[Twilio SMS] Send failed:`, err.message);
    throw new Error(err.message || 'Failed to send OTP SMS. Please try again.');
  }

  console.log(`[Twilio SMS] Sent: sid=${message.sid} status=${message.status}`);

  return {
    provider: 'twilio-sms',
    requestId: message.sid,
    reference: e164Phone,
    otp: code,
  };
};

const verifyOtp = async () => {
  throw new Error('Direct verification is handled by the OTP service for twilio-sms.');
};

module.exports = {
  name: 'twilio-sms',
  maskPhone,
  toE164,
  sendOtp,
  verifyOtp,
};
