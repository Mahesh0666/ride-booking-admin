const Ride = require('../models/Ride');
const { createNotification } = require('../controllers/notificationController');

const dispatchScheduledRides = async () => {
  try {
    const dueRides = await Ride.find({
      status: 'scheduled',
      scheduledAt: { $lte: new Date() },
    });

    for (const ride of dueRides) {
      ride.status = 'requested';
      await ride.save();

      const populatedRide = await Ride.findById(ride._id)
        .populate('rider', 'name phone rating profileImage')
        .lean();

      if (global.io) {
        global.io.to('drivers_nearby').emit('ride_requested', populatedRide);
      }

      createNotification({
        userId: ride.rider,
        type: 'ride',
        title: 'Scheduled ride dispatch',
        message: 'Your scheduled ride is being dispatched. Finding a driver...',
        data: { rideId: ride._id },
      });
    }
  } catch (err) {
    console.error('Scheduled ride dispatch error:', err.message);
  }
};

const startScheduledRideDispatcher = () => {
  const interval = setInterval(dispatchScheduledRides, 15000);
  console.log('Scheduled ride dispatcher started (every 15s)');
  return interval;
};

module.exports = { dispatchScheduledRides, startScheduledRideDispatcher };