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

const sendOtp = async ({ phone, length = 6, ttlSeconds = 300 }) => {
  const { authKey, senderId, templateId } = config.otp.msg91;
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured');
  }

  const e164Phone = toE164(phone);
  console.log(`[MSG91] Sending OTP to ${e164Phone}`);

  if (templateId) {
    // MSG91 v5 API (Template-based)
    const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${e164Phone}`;
    const headers = {
      authkey: authKey,
      'Content-Type': 'application/json',
    };

    console.log(`[MSG91 v5] Posting to ${url}`);
    const response = await axios.post(url, {}, { headers, timeout: 10000 });
    const body = response.data || {};
    console.log(`[MSG91 v5] Response:`, JSON.stringify(body));

    if (body.type !== 'success') {
      throw new Error(body.message || 'Failed to send OTP via MSG91 v5');
    }

    return {
      provider: 'msg91',
      requestId: body.request_id || body.message || null,
    };
  } else {
    // Legacy MSG91 SendOTP API
    const params = {
      mobile: e164Phone,
      authkey: authKey,
      otp_expiry: Math.max(1, Math.round(ttlSeconds / 60)),
      otp_length: length || 6,
    };
    if (senderId) params.sender = senderId;

    const url = `http://api.msg91.com/api/sendotp.php`;
    console.log(`[MSG91 Legacy] Requesting ${url}`);
    const response = await axios.get(url, { params, timeout: 10000 });
    const body = response.data || {};
    console.log(`[MSG91 Legacy] Response:`, JSON.stringify(body));

    if (body.type !== 'success') {
      throw new Error(body.message || 'Failed to send OTP via MSG91');
    }

    return {
      provider: 'msg91',
      requestId: body.message || null,
    };
  }
};

const verifyOtp = async ({ phone, otp, requestId }) => {
  const { authKey, templateId } = config.otp.msg91;
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured');
  }

  const e164Phone = toE164(phone);
  console.log(`[MSG91] Verifying OTP for ${e164Phone}`);

  if (templateId) {
    // MSG91 v5 Verification
    const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${e164Phone}&otp=${otp}`;
    const headers = { authkey: authKey };

    try {
      const response = await axios.get(url, {
        headers,
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      const body = response.data || {};
      console.log(`[MSG91 v5 Verify] Response:`, JSON.stringify(body));
      const verified = body.type === 'success' || body.message === 'OTP verified success';

      return {
        verified,
        message: body.message || (verified ? 'OTP verified successfully' : 'OTP verification failed'),
        requestId: requestId || null,
      };
    } catch (err) {
      console.error(`[MSG91 v5 Verify] Error:`, err.message);
      return { verified: false, message: 'OTP verification error', requestId };
    }
  } else {
    // Legacy MSG91 Verification
    const params = {
      mobile: e164Phone,
      authkey: authKey,
      otp,
    };

    const url = `http://api.msg91.com/api/verifyRequestOTP.php`;
    const response = await axios.get(url, {
      params,
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });

    const body = response.data || {};
    console.log(`[MSG91 Legacy Verify] Response:`, JSON.stringify(body));
    const verified = body.type === 'success';

    return {
      verified,
      message: body.message || (verified ? 'OTP verified successfully' : 'OTP verification failed'),
      requestId: requestId || null,
    };
  }
};

module.exports = {
  name: 'msg91',
  maskPhone,
  toE164,
  sendOtp,
  verifyOtp,
};
