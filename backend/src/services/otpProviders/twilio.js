const config = require('../../config/config');

let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;

  const { accountSid, authToken } = config.otp.twilio;
  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured');
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

const sendOtp = async ({ phone, length = 6, ttlSeconds = 300 }) => {
  const client = getClient();
  const e164Phone = toE164(phone);
  const serviceSid = config.otp.twilio.verifyServiceSid;

  if (!serviceSid) {
    throw new Error('TWILIO_VERIFY_SERVICE_SID must be configured');
  }

  console.log(`[Twilio Verify] Sending OTP to ${e164Phone}`);

  const verification = await client.verify.v2
    .services(serviceSid)
    .verifications.create({
      to: e164Phone,
      channel: 'sms',
      locale: 'en',
    });

  console.log(`[Twilio Verify] Sent: status=${verification.status} sid=${verification.sid}`);

  return {
    provider: 'twilio',
    requestId: verification.sid,
    reference: e164Phone,
    status: verification.status,
  };
};

const verifyOtp = async ({ phone, otp, requestId, reference }) => {
  const client = getClient();
  const e164Phone = reference || toE164(phone);
  const serviceSid = config.otp.twilio.verifyServiceSid;

  console.log(`[Twilio Verify] Checking OTP for ${e164Phone}`);

  const verificationCheck = await client.verify.v2
    .services(serviceSid)
    .verificationChecks.create({
      to: e164Phone,
      code: otp,
    });

  const verified = verificationCheck.status === 'approved';

  console.log(`[Twilio Verify] Result: status=${verificationCheck.status}`);

  return {
    verified,
    message: verified ? 'OTP verified successfully' : 'OTP verification failed',
    requestId,
  };
};

module.exports = {
  name: 'twilio',
  maskPhone,
  toE164,
  sendOtp,
  verifyOtp,
};
