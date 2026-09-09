const admin = require('firebase-admin');
const crypto = require('crypto');

let initialized = false;

function getFirebaseAdmin() {
  if (initialized) return admin;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
  }

  try {
    const parsed = typeof serviceAccount === 'string' ? JSON.parse(serviceAccount) : serviceAccount;
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
    }
  } catch (err) {
    throw new Error(`Failed to initialize Firebase: ${err.message}`);
  }

  initialized = true;
  return admin;
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
  const e164Phone = toE164(phone);
  console.log(`[Firebase Auth] Send OTP request for ${e164Phone}`);

  const requestId = crypto.randomBytes(16).toString('hex');

  return {
    provider: 'firebase',
    requestId,
    reference: e164Phone,
    message: 'OTP will be sent via Firebase client SDK',
  };
};

const verifyOtp = async ({ phone, otp, requestId, reference }) => {
  const e164Phone = toE164(phone);
  console.log(`[Firebase Auth] Verify request for ${e164Phone}`);

  return {
    verified: true,
    message: 'OTP verification handled by Firebase client SDK',
    requestId,
  };
};

const verifyIdToken = async (idToken) => {
  const firebase = getFirebaseAdmin();
  const decoded = await firebase.auth().verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    phone: decoded.phone_number,
    email: decoded.email,
  };
};

module.exports = {
  name: 'firebase',
  maskPhone,
  toE164,
  sendOtp,
  verifyOtp,
  verifyIdToken,
};
