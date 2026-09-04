const Ride = require('../models/Ride');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Service = require('../models/Service');
const { createNotification } = require('./notificationController');
const { calculateFare } = require('../utils/fareCalculator');
const routingService = require('../services/routingService');

const NEARBY_DRIVER_RADIUS_KM = 3;
const MATCH_TIMEOUT_MS = 3 * 60 * 1000;
const matchTimers = new Map();

const failUnmatchedRide = async (rideId, riderId, fare) => {
  try {
    const ride = await Ride.findById(rideId).select('-otp');
    if (!ride || ride.status !== 'requested') return;

    const suggestedTip = Math.round((Number(fare) || 0) * 0.2);
    ride.status = 'failed';
    ride.cancellationBy = 'system';
    ride.cancellationReason = 'No nearby driver accepted within the 3-minute window';
    await ride.save();

    const payload = { rideId: ride._id, suggestedTip };
    if (global.io) {
      global.io.to(`user_${riderId}`)?.emit('ride_high_demand', payload);
    }
    createNotification({
      userId: riderId,
      type: 'ride',
      title: 'No driver available',
      message: 'High demand right now. Try again with an extra tip to get matched faster.',
      data: { rideId: ride._id, suggestedTip },
    });

    console.log(`[ride] ride ${ride._id} auto-failed after ${MATCH_TIMEOUT_MS / 1000}s with no accept`);
  } catch (err) {
    console.error('[ride] failUnmatchedRide error:', err.message);
  } finally {
    matchTimers.delete(rideId.toString());
  }
};

const estimateFare = async (req, res, next) => {
  const {
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    vehicleType = 'auto',
  } = req.query;

  try {
    if (
      pickupLat == null ||
      pickupLng == null ||
      dropoffLat == null ||
      dropoffLng == null
    ) {
      return res.status(400).json({
        error: { message: 'pickupLat, pickupLng, dropoffLat, dropoffLng are required' },
      });
    }

    const lat1 = parseFloat(pickupLat);
    const lng1 = parseFloat(pickupLng);
    const lat2 = parseFloat(dropoffLat);
    const lng2 = parseFloat(dropoffLng);

    const [service, path] = await Promise.all([
      Service.findOne({ code: vehicleType, isActive: true }),
      routingService.route({ lat1, lng1, lat2, lng2 }),
    ]);

    const distance = path.distanceKm;
    const duration = path.durationMin;

    const pricing = service
      ? {
          baseFare: service.baseFare,
          perKm: service.perKm,
          perMin: service.perMin,
          minFare: service.minFare,
          commissionRate: service.commissionRate,
          surgeMin: service.surgeMin,
          surgeMax: service.surgeMax,
          currency: 'inr',
        }
      : {};

    const fareInfo = calculateFare(distance, duration, 1.0, pricing);

    res.status(200).json({
      success: true,
      estimate: {
        pickup: { lat: lat1, lng: lng1 },
        dropoff: { lat: lat2, lng: lng2 },
        distanceKm: parseFloat(distance.toFixed(2)),
        durationMin: duration != null ? parseFloat(duration.toFixed(1)) : null,
        provider: path.provider,
        vehicleType,
        fare: fareInfo.fare,
        commission: fareInfo.commission,
        driverEarnings: fareInfo.driverEarnings,
        currency: 'inr',
      },
    });
  } catch (err) {
    next(err);
  }
};

const requestRide = async (req, res, next) => {
  const {
    pickupLat,
    pickupLng,
    pickupAddress,
    dropoffLat,
    dropoffLng,
    dropoffAddress,
    vehicleType = 'auto',
    scheduledAt,
    paymentMethod,
    fare,
    tip = 0,
  } = req.body;

  try {
    const rider = req.user;

    const existingRide = await Ride.findOne({
      rider: rider._id,
      status: { $in: ['scheduled', 'requested', 'accepted', 'arriving', 'in_progress'] },
    });

    if (existingRide) {
      return res.status(400).json({
        error: { message: 'You have an active ride' },
      });
    }

    const service = await Service.findOne({ code: vehicleType, isActive: true });
    const pricing = service
      ? {
          baseFare: service.baseFare,
          perKm: service.perKm,
          perMin: service.perMin,
          minFare: service.minFare,
          commissionRate: service.commissionRate,
          surgeMin: service.surgeMin,
          surgeMax: service.surgeMax,
        }
      : {};

    const isScheduled = !!scheduledAt && new Date(scheduledAt).getTime() > Date.now();

    const path = await routingService.route({
      lat1: parseFloat(pickupLat),
      lng1: parseFloat(pickupLng),
      lat2: parseFloat(dropoffLat),
      lng2: parseFloat(dropoffLng),
    });

    const distance = path.distanceKm;
    const duration = path.durationMin;
    const fareInfo = calculateFare(distance, duration, 1.0, pricing);

    const quotedFare = fare != null && Number(fare) > 0 ? Math.round(Number(fare) * 100) / 100 : fareInfo.fare;

    const rideOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const ride = await Ride.create({
      rider: rider._id,
      pickupLocation: {
        type: 'Point',
        coordinates: [parseFloat(pickupLng), parseFloat(pickupLat)],
        address: pickupAddress,
      },
      dropoffLocation: {
        type: 'Point',
        coordinates: [parseFloat(dropoffLng), parseFloat(dropoffLat)],
        address: dropoffAddress,
      },
      vehicleType,
      service: service ? service._id : undefined,
      fare: quotedFare,
      distance,
      duration,
      status: isScheduled ? 'scheduled' : 'requested',
      isScheduled,
      scheduledAt: isScheduled ? new Date(scheduledAt) : undefined,
      otp: rideOtp,
      tip: Number(tip) || 0,
    });

    if (paymentMethod && rider.defaultPaymentMethod !== paymentMethod) {
      await User.findByIdAndUpdate(rider._id, { defaultPaymentMethod: paymentMethod });
    }

    const populatedRide = await Ride.findById(ride._id)
      .populate('rider', 'name phone rating profileImage')
      .lean();

    if (isScheduled) {
      createNotification({
        userId: rider._id,
        type: 'ride',
        title: 'Ride scheduled',
        message: `Your ${service?.name || vehicleType} is scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        data: { rideId: ride._id },
      });

      const scheduledPayload = {
        ...populatedRide,
        otp: rideOtp,
      };

      return res.status(201).json({
        success: true,
        ride: scheduledPayload,
        scheduled: true,
      });
    }

    const safePayload = (() => {
      const copy = { ...populatedRide };
      delete copy.otp;
      return copy;
    })();

    // Notify only approved/online drivers physically within 3km of the pickup
    const nearbyDrivers = await User.find({
      role: 'driver',
      isDriver: true,
      isVerified: true,
      onboardingStatus: 'approved',
      isOnline: true,
      currentLocation: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(pickupLng), parseFloat(pickupLat)],
            NEARBY_DRIVER_RADIUS_KM / 6378.1,
          ],
        },
      },
    }).select('_id');

    const notifiedIds = nearbyDrivers.map((d) => d._id.toString());
    for (const d of nearbyDrivers) {
      if (global.io) {
        global.io.to(`driver_${d._id.toString()}`).emit('ride_requested', safePayload);
      }
    }

    console.log(
      `[ride] ride_requested => ${notifiedIds.length} nearby driver(s) within ${NEARBY_DRIVER_RADIUS_KM}km for ride ${ride._id} (${notifiedIds.join(',') || 'none'})`
    );

    // 3-minute window: no driver accepted -> fail the ride and suggest a tip
    const timer = setTimeout(
      () => failUnmatchedRide(ride._id, rider._id, quotedFare),
      MATCH_TIMEOUT_MS
    );
    matchTimers.set(ride._id.toString(), timer);

    res.status(201).json({
      success: true,
      ride: {
        ...populatedRide,
        otp: rideOtp,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('rider', 'name phone rating profileImage')
      .populate('driver', 'name phone rating profileImage vehicle')
      .populate({
        path: 'driver',
        populate: { path: 'vehicle' },
      })
      .populate('payment');

    if (!ride) {
      return res.status(404).json({
        error: { message: 'Ride not found' },
      });
    }

    if (
      req.user.role !== 'admin' &&
      ride.rider._id.toString() !== req.user._id.toString() &&
      (!ride.driver || ride.driver._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        error: { message: 'Not authorized to view this ride' },
      });
    }

    res.status(200).json({
      success: true,
      ride,
    });
  } catch (err) {
    next(err);
  }
};

const getMyRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({
      [req.user.role === 'driver' ? 'driver' : 'rider']: req.user._id,
    })
      .populate('rider', 'name phone rating profileImage')
      .populate('driver', 'name phone rating profileImage')
      .populate('payment')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (err) {
    next(err);
  }
};

const acceptRide = async (req, res, next) => {
  const { rideId } = req.params;
  const driver = req.user;

  try {
    if (!driver.isDriver) {
      return res.status(403).json({
        error: { message: 'Only drivers can accept rides' },
      });
    }

    if (!driver.isVerified || driver.onboardingStatus !== 'approved') {
      return res.status(403).json({
        error: { message: 'Your driver profile must be approved before accepting rides' },
      });
    }

    if (!driver.isOnline) {
      return res.status(400).json({
        error: { message: 'You must be online to accept rides' },
      });
    }

    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: 'requested', driver: null },
      { $set: { status: 'accepted', driver: driver._id } },
      { new: true }
    ).populate('rider', 'name phone rating profileImage');

    if (matchTimers.has(rideId.toString())) {
      clearTimeout(matchTimers.get(rideId.toString()));
      matchTimers.delete(rideId.toString());
    }

    if (!ride) {
      return res.status(400).json({
        error: { message: 'This ride is no longer available' },
      });
    }

    const populatedRide = await Ride.findById(ride._id)
      .populate('rider', 'name phone rating profileImage')
      .populate('driver', 'name phone rating profileImage')
      .populate({ path: 'driver', populate: { path: 'vehicle' } })
      .lean();

    const safePayload = { ...populatedRide };
    delete safePayload.otp;
    // The rider must be able to read the OTP to tell the driver; keep it in the
    // rider-targeted payload (the driver never needs the OTP over the socket —
    // they fetch it via getRide and enter it themselves).
    const riderPayload = { ...populatedRide };

    if (global.io) {
      global.io
        .to('drivers_nearby')
        .emit('ride_taken', {
          rideId: ride._id,
          acceptedBy: driver._id,
          acceptedByName: driver.name,
        });

      // Emit to user_<riderId> (rider's personal room — joined on socket connect)
      global.io.to(`user_${ride.rider._id}`).emit('ride_accepted', riderPayload);
      // Also emit to ride_<rideId> room as a backup channel in case the rider
      // reconnected and the personal room was stale.
      global.io.to(`ride_${ride._id}`).emit('ride_accepted', riderPayload);
      global.io.to(`driver_${driver._id}`).emit('ride_accepted', safePayload);
    }

    console.log(
      `[ride] ride_accepted => rider=${ride.rider._id} ride=${ride._id} driver=${driver._id} (${driver.name})`
    );

    createNotification({
      userId: ride.rider._id,
      type: 'ride',
      title: 'Driver assigned',
      message: `${driver.name} is on the way to pick you up`,
      data: { rideId: ride._id },
    });

const isRider = ride.rider._id.toString() === req.user._id.toString();
    let responseRide = ride;

    if (!isRider) {
      responseRide = ride.toObject ? ride.toObject() : { ...ride };
      delete responseRide.otp;
    }

    res.status(200).json({
      success: true,
      ride: responseRide,
    });
  } catch (err) {
    next(err);
  }
};

const verifyRideOtp = async (req, res, next) => {
  const { rideId } = req.params;
  const { otp } = req.body;
  const driver = req.user;

  try {
    if (!driver.isDriver) {
      return res.status(403).json({
        error: { message: 'Only drivers can verify ride OTP' },
      });
    }

    if (!otp || String(otp).trim().length !== 4) {
      return res.status(400).json({
        error: { message: 'Please enter the 4-digit OTP' },
      });
    }

    const ride = await Ride.findById(rideId).populate(
      'rider',
      'name phone rating profileImage'
    );

    if (!ride) {
      return res.status(404).json({
        error: { message: 'Ride not found' },
      });
    }

    if (!ride.driver || ride.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        error: { message: 'You are not assigned to this ride' },
      });
    }

    if (ride.status !== 'accepted' && ride.status !== 'arriving') {
      return res.status(400).json({
        error: { message: 'Ride is not in a state that can be started' },
      });
    }

    if (String(ride.otp) !== String(otp).trim()) {
      return res.status(400).json({
        error: { message: 'Incorrect OTP. Please ask the rider again.' },
      });
    }

    ride.status = 'in_progress';
    ride.otpVerified = true;
    ride.startedAt = new Date();
    await ride.save();

    const populatedRide = await Ride.findById(ride._id)
      .populate('rider', 'name phone rating profileImage')
      .populate('driver', 'name phone rating profileImage')
      .populate({ path: 'driver', populate: { path: 'vehicle' } })
      .lean();

    const safePayload = { ...populatedRide };
    delete safePayload.otp;

    if (global.io) {
      global.io
        .to(`user_${ride.rider._id}`)
        .emit('ride_status_updated', { rideId: ride._id, status: 'in_progress' });
      global.io.to(`driver_${driver._id}`).emit('ride_status_updated', safePayload);
    }

    res.status(200).json({
      success: true,
      ride: safePayload,
    });
  } catch (err) {
    next(err);
  }
};

const updateRideStatus = async (req, res, next) => {
  const { rideId } = req.params;
  const { status } = req.body;
  const driver = req.user;

  try {
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        error: { message: 'Ride not found' },
      });
    }

    if (!ride.driver || ride.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        error: { message: 'Not authorized to update this ride' },
      });
    }

    if (status === 'cancelled') {
      ride.status = 'cancelled';
      ride.cancelledAt = new Date();
      ride.cancellationBy = 'driver';
      await ride.save();

      if (global.io) {
        global.io.to(`user_${ride.rider}`).emit('ride_cancelled', {
          rideId,
          cancelledBy: 'driver',
        });
      }

      return res.status(200).json({
        success: true,
        ride,
      });
    }

    const validStatuses = ['arriving', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: { message: 'Invalid status' },
      });
    }

    ride.status = status;

    if (status === 'completed') {
      ride.completedAt = new Date();

      const service = ride.service
        ? await Service.findById(ride.service)
        : null;
      const commissionRate = service?.commissionRate ?? 0.1;
      const commission = parseFloat((ride.fare * commissionRate).toFixed(2));
      const driverEarnings = parseFloat((ride.fare - commission).toFixed(2));

      const payment = await Payment.create({
        ride: ride._id,
        rider: ride.rider,
        driver: ride.driver,
        amount: ride.fare,
        driverEarnings,
        commission,
        paymentStatus: 'pending',
      });

      ride.payment = payment._id;

      await User.findByIdAndUpdate(ride.driver, {
        $inc: { earnings: driverEarnings, totalRides: 1 },
      });
    }

    await ride.save();

    const populatedRide = await Ride.findById(ride._id)
      .populate('rider', 'name phone rating profileImage')
      .populate('driver', 'name phone rating profileImage');

    if (global.io) {
      global.io.to(`user_${ride.rider}`).emit('ride_status_updated', populatedRide);
      global.io.to(`driver_${driver._id}`).emit('ride_status_updated', populatedRide);
    }

    if (status === 'completed') {
      createNotification({
        userId: ride.rider,
        type: 'payment',
        title: 'Ride completed',
        message: `Your ride is complete. Fare: ₹${ride.fare?.toFixed(2)}`,
        data: { rideId: ride._id },
      });
    }

    res.status(200).json({
      success: true,
      ride: populatedRide,
    });
  } catch (err) {
    next(err);
  }
};

const cancelRide = async (req, res, next) => {
  const { rideId } = req.params;
  const { reason } = req.body;

  try {
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        error: { message: 'Ride not found' },
      });
    }

    if (req.user._id.toString() !== ride.rider.toString()) {
      return res.status(403).json({
        error: { message: 'Not authorized to cancel this ride' },
      });
    }

    if (!['scheduled', 'requested', 'accepted', 'arriving'].includes(ride.status)) {
      return res.status(400).json({
        error: { message: 'Cannot cancel this ride at current status' },
      });
    }

    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.cancellationBy = 'rider';
    ride.cancellationReason = reason;

    await ride.save();

    if (global.io) {
      global.io
        .to(`user_${ride.rider}`)
        .emit('ride_cancelled', { rideId, cancelledBy: 'rider' });

      if (ride.driver) {
        global.io
          .to(`driver_${ride.driver}`)
          .emit('ride_cancelled', { rideId, cancelledBy: 'rider' });
      }
    }

    res.status(200).json({
      success: true,
      ride,
    });
  } catch (err) {
    next(err);
  }
};

const rateRide = async (req, res, next) => {
  const { rideId } = req.params;
  const { score, comment } = req.body;

  try {
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        error: { message: 'Ride not found' },
      });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({
        error: { message: 'Cannot rate a ride that is not completed' },
      });
    }

    if (req.user._id.toString() !== ride.rider.toString()) {
      return res.status(403).json({
        error: { message: 'Only the rider can rate the ride' },
      });
    }

    ride.rating = {
      rated: true,
      score,
      comment,
    };

    await ride.save();

    const driver = await User.findById(ride.driver);
    if (!driver) {
      return res.status(404).json({
        error: { message: 'Driver not found' },
      });
    }
    const rides = driver.totalRides || 1;
    const newRating = (driver.rating * (rides - 1) + score) / rides;
    driver.rating = parseFloat(newRating.toFixed(2));
    await driver.save();

    res.status(200).json({
      success: true,
      ride,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requestRide,
  getRide,
  getMyRides,
  acceptRide,
  verifyRideOtp,
  updateRideStatus,
  cancelRide,
  rateRide,
  estimateFare,
  failUnmatchedRide,
  matchTimers,
};