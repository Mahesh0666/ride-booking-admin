const axios = require('axios');
const config = require('../../config/config');

const maskPhone = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
};

const toE164 = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  return `${config.otp.countryCode}${digits}`;
};

const sendOtp = async ({ phone, length, ttlSeconds, ip }) => {
  const { authKey, senderId, templateId, baseUrl } = config.otp.msg91;
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured');
  }

  const e164Phone = toE164(phone);
  console.log(`[MSG91] Sending OTP to ${e164Phone}`);

  const params = {
    mobile: e164Phone,
    authkey: authKey,
    otp_expiry: Math.max(1, Math.round(ttlSeconds / 60)),
    userip: ip || '',
  };

  if (templateId) {
    params.template_id = templateId;
  } else {
    params.otp_length = length || 6;
  }

  if (senderId) params.sender_id = senderId;

  const url = `${baseUrl}/api/v5/otp`;
  console.log(`[MSG91] Request URL: ${url}`);
  console.log(`[MSG91] Params: mobile=${e164Phone}, template_id=${params.template_id || 'none'}, otp_length=${params.otp_length}`);

  const response = await axios.post(url, null, { params, timeout: 10000 });

  const body = response.data || {};
  console.log(`[MSG91] Response:`, JSON.stringify(body));

  if (body.type !== 'success') {
    throw new Error(body.message || 'Failed to send OTP via MSG91');
  }

  return {
    provider: 'msg91',
    requestId: body.request_id || null,
  };
};

const verifyOtp = async ({ phone, otp, requestId }) => {
  const { authKey, baseUrl } = config.otp.msg91;
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured');
  }

  const params = {
    mobile: toE164(phone),
    authkey: authKey,
    otp_expiry: Math.max(1, Math.round(config.otp.ttlSeconds / 60)),
  };

  const url = `${baseUrl}/api/v5/otp/verify`;
  const response = await axios.get(url, {
    params: { ...params, otp },
    maxRedirects: 0,
    timeout: 10000,
    validateStatus: (status) => status < 500,
  });

  const body = response.data || {};
  const verified = body.type === 'success';

  return {
    verified,
    message: body.message || (verified ? 'OTP verified successfully' : 'OTP verification failed'),
    requestId: body.request_id || requestId,
  };
};

module.exports = {
  name: 'msg91',
  maskPhone,
  toE164,
  sendOtp,
  verifyOtp,
};
