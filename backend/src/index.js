const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(__dirname, '..', `.env.${nodeEnv}`) });
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const http = require('http');
const connectDB = require('./config/db');
const config = require('./config/config');
const setupSocket = require('./socket/socketHandler');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

require('./models/User');
require('./models/Vehicle');
require('./models/Ride');
require('./models/Payment');
require('./models/Service');
require('./models/Notification');
require('./models/WalletTransaction');
require('./models/OtpVerification');
require('./models/EmergencyContact');
require('./models/SosEvent');
require('./models/Payout');
require('./models/CabBooking');

const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const walletRoutes = require('./routes/walletRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const addressRoutes = require('./routes/addressRoutes');
const sosRoutes = require('./routes/sosRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const cabBookingRoutes = require('./routes/cabBookingRoutes');

connectDB().then(async () => {
  const { seedServices } = require('./seed/seedServices');
  await seedServices();

  const { seedAdmin } = require('./seed/seedAdmin');
  await seedAdmin();
});

const app = express();

app.use(helmet());
app.use(mongoSanitize());

const allowedOrigins = config.isProduction
  ? [
      process.env.ADMIN_DASHBOARD_URL,
      'https://ride-booking-dashboard.onrender.com',
      'https://ride-admin-dashboard.onrender.com',
      'https://bumbblejobs.com',
      'https://www.bumbblejobs.com',
    ].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://192.168.1.9:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./controllers/paymentController').handleWebhook);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: { message: 'Too many attempts, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: { message: 'Too many OTP requests, please wait' } },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ride Booking API is running',
    version: '1.0.0',
    mongoState: require('mongoose').connection.readyState,
  });
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/otp', otpLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/cab-bookings', cabBookingRoutes);

if (config.isProduction) {
  const adminDashboardPath = path.resolve(__dirname, '..', '..', 'admin-dashboard', 'dist');
  app.use(express.static(adminDashboardPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(adminDashboardPath, 'index.html'));
  });
}

app.use(errorHandler);

const server = http.createServer(app);

setupSocket(server);

const { startScheduledRideDispatcher } = require('./jobs/scheduledRideDispatcher');

server.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  startScheduledRideDispatcher();
});
