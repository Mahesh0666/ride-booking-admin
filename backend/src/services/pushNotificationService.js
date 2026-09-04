const admin = require('firebase-admin');
const logger = require('../utils/logger');

let initialized = false;

const initFirebase = () => {
  if (initialized) return;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    logger.warn('FIREBASE_SERVICE_ACCOUNT not configured - push notifications disabled');
    return;
  }

  try {
    const serviceAccountJSON = JSON.parse(serviceAccount);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountJSON),
    });
    initialized = true;
    logger.info('Firebase Admin initialized successfully');
  } catch (err) {
    logger.error('Failed to initialize Firebase:', err.message);
  }
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!initialized) return null;

  try {
    const message = {
      notification: { title, body },
      data,
      token: fcmToken,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };

    const response = await admin.messaging().send(message);
    return response;
  } catch (err) {
    if (err.code === 'messaging/registration-token-not-registered') {
      logger.warn(`Invalid FCM token: ${fcmToken}`);
    } else {
      logger.error('Push notification failed:', err.message);
    }
    return null;
  }
};

const sendToMultipleDevices = async (tokens, title, body, data = {}) => {
  if (!initialized || !tokens.length) return null;

  try {
    const message = {
      notification: { title, body },
      data,
      tokens,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return response;
  } catch (err) {
    logger.error('Batch push notification failed:', err.message);
    return null;
  }
};

module.exports = {
  initFirebase,
  sendPushNotification,
  sendToMultipleDevices,
};
