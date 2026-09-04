const EmergencyContact = require('../models/EmergencyContact');
const SosEvent = require('../models/SosEvent');
const Ride = require('../models/Ride');
const User = require('../models/User');
const { sendPushNotification } = require('../services/pushNotificationService');

const getEmergencyContacts = async (req, res, next) => {
  try {
    const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ name: 1 });
    res.status(200).json({ success: true, contacts });
  } catch (err) {
    next(err);
  }
};

const addEmergencyContact = async (req, res, next) => {
  const { name, phone, relationship } = req.body;

  try {
    if (!name || !phone) {
      return res.status(400).json({ error: { message: 'Name and phone are required' } });
    }

    const count = await EmergencyContact.countDocuments({ user: req.user._id });
    if (count >= 5) {
      return res.status(400).json({ error: { message: 'Maximum 5 emergency contacts allowed' } });
    }

    const contact = await EmergencyContact.create({
      user: req.user._id,
      name,
      phone,
      relationship: relationship || 'other',
    });

    res.status(201).json({ success: true, contact });
  } catch (err) {
    next(err);
  }
};

const removeEmergencyContact = async (req, res, next) => {
  try {
    const contact = await EmergencyContact.findOneAndDelete({
      _id: req.params.contactId,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({ error: { message: 'Contact not found' } });
    }

    res.status(200).json({ success: true, message: 'Contact removed' });
  } catch (err) {
    next(err);
  }
};

const triggerSos = async (req, res, next) => {
  const { latitude, longitude, address, rideId, message } = req.body;

  try {
    if (!latitude || !longitude) {
      return res.status(400).json({ error: { message: 'Location is required for SOS' } });
    }

    const contacts = await EmergencyContact.find({ user: req.user._id });

    const sosEvent = await SosEvent.create({
      user: req.user._id,
      ride: rideId || undefined,
      type: 'sos',
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
        address,
      },
      message: message || 'Emergency SOS triggered',
      notifiedContacts: contacts.map((c) => c._id),
    });

    if (global.io) {
      global.io.to('admin').emit('sos_alert', {
        sosId: sosEvent._id,
        userId: req.user._id,
        userName: req.user.name,
        userPhone: req.user.phone,
        location: { latitude, longitude, address },
        rideId,
        message: sosEvent.message,
        timestamp: sosEvent.createdAt,
      });

      if (rideId) {
        const ride = await Ride.findById(rideId).select('driver rider');
        if (ride?.driver) {
          global.io.to(`driver_${ride.driver}`).emit('sos_alert', {
            sosId: sosEvent._id,
            riderName: req.user.name,
            location: { latitude, longitude },
            message: sosEvent.message,
          });
        }
        if (ride?.rider && ride.rider.toString() !== req.user._id.toString()) {
          global.io.to(`user_${ride.rider}`).emit('sos_alert', {
            sosId: sosEvent._id,
            userName: req.user.name,
            location: { latitude, longitude },
            message: sosEvent.message,
          });
        }
      }
    }

    const user = await User.findById(req.user._id).select('fcmToken name phone');
    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        'SOS Alert Sent',
        'Your emergency contacts and admin have been notified.'
      );
    }

    res.status(200).json({
      success: true,
      sosId: sosEvent._id,
      message: 'SOS triggered. Emergency contacts and admin have been notified.',
      contactsNotified: contacts.length,
    });
  } catch (err) {
    next(err);
  }
};

const shareLiveLocation = async (req, res, next) => {
  const { latitude, longitude, rideId, durationMinutes = 30 } = req.body;

  try {
    if (!latitude || !longitude) {
      return res.status(400).json({ error: { message: 'Location is required' } });
    }

    const contacts = await EmergencyContact.find({ user: req.user._id });

    const sosEvent = await SosEvent.create({
      user: req.user._id,
      ride: rideId || undefined,
      type: 'share_location',
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      message: `Live location shared for ${durationMinutes} minutes`,
      notifiedContacts: contacts.map((c) => c._id),
    });

    if (global.io) {
      global.io.to('admin').emit('location_shared', {
        userId: req.user._id,
        userName: req.user.name,
        location: { latitude, longitude },
        durationMinutes,
        timestamp: sosEvent.createdAt,
      });
    }

    res.status(200).json({
      success: true,
      message: `Live location shared with ${contacts.length} contacts`,
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
    });
  } catch (err) {
    next(err);
  }
};

const resolveSos = async (req, res, next) => {
  try {
    const sosEvent = await SosEvent.findByIdAndUpdate(
      req.params.sosId,
      { resolved: true, resolvedAt: new Date(), resolvedBy: req.user._id },
      { new: true }
    );

    if (!sosEvent) {
      return res.status(404).json({ error: { message: 'SOS event not found' } });
    }

    if (global.io) {
      global.io.to(`user_${sosEvent.user}`).emit('sos_resolved', {
        sosId: sosEvent._id,
        resolvedBy: req.user.name,
      });
    }

    res.status(200).json({ success: true, message: 'SOS resolved' });
  } catch (err) {
    next(err);
  }
};

const getSosEvents = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    const events = await SosEvent.find(query)
      .populate('user', 'name phone')
      .populate('ride')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, count: events.length, events });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
  triggerSos,
  shareLiveLocation,
  resolveSos,
  getSosEvents,
};
