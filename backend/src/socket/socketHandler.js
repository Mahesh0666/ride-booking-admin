const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const Ride = require('../models/Ride');

const setupSocket = (server) => {
  const allowedOrigins = config.isProduction
    ? [process.env.ADMIN_DASHBOARD_URL || 'https://admin.yourdomain.com']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://192.168.1.9:5173'];

  const io = socketIO(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
  });

  global.io = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const roomName = `${socket.user?.role}_${socket.userId}`;
    socket.join(roomName);
    socket.join(`user_${socket.userId}`);

    if (socket.user?.role === 'driver') {
      if (socket.user?.isVerified && socket.user?.onboardingStatus === 'approved') {
        socket.join('drivers_nearby');
      }
      socket.join(`driver_${socket.userId}`);
    }

    socket.on('subscribe_ride', async (rideId) => {
      try {
        const ride = await Ride.findById(rideId).select('rider driver');
        if (!ride) return;

        const userId = socket.userId;
        const isRider = ride.rider?.toString() === userId;
        const isDriver = ride.driver?.toString() === userId;
        const isAdmin = socket.user?.role === 'admin';

        if (isRider || isDriver || isAdmin) {
          socket.join(`ride_${rideId}`);
        }
      } catch (err) {
        // silently reject invalid ride IDs
      }
    });

    socket.on('driver_location', (data) => {
      const lat = data?.location?.latitude;
      const lng = data?.location?.longitude;
      if (typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng)) {
        User.findByIdAndUpdate(socket.userId, {
          currentLocation: { type: 'Point', coordinates: [lng, lat] },
        }).catch(() => {});
      }
      io.to('drivers_nearby').emit('driver_location_update', {
        driverId: socket.userId,
        location: data.location,
      });
    });

    socket.on('driver_position', (data) => {
      if (!data?.rideId || !data?.location?.latitude || !data?.location?.longitude) return;
      io.to(`ride_${data.rideId}`).emit('driver_position_update', {
        rideId: data.rideId,
        driverId: socket.userId,
        location: data.location,
      });
    });

    socket.on('disconnect', () => {
      if (socket.user?.role === 'driver') {
        User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          $unset: { currentLocation: '' },
        }).catch(() => {});
      }
    });
  });

  return io;
};

module.exports = setupSocket;
