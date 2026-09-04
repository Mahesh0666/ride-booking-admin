const User = require('../models/User');

const getSavedAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('savedAddresses');
    res.status(200).json({
      success: true,
      addresses: user.savedAddresses || [],
    });
  } catch (err) {
    next(err);
  }
};

const addSavedAddress = async (req, res, next) => {
  const { label = 'Other', address, latitude, longitude, isFavorite } = req.body;

  try {
    if (!address) {
      return res.status(400).json({
        error: { message: 'Address is required' },
      });
    }

    const user = await User.findById(req.user._id);

    if ((user.savedAddresses || []).length >= 5) {
      return res.status(400).json({
        error: { message: 'Maximum 5 saved addresses allowed' },
      });
    }

    const newAddress = {
      label,
      address,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      isFavorite: !!isFavorite,
    };

    user.savedAddresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      address: user.savedAddresses[user.savedAddresses.length - 1],
    });
  } catch (err) {
    next(err);
  }
};

const updateSavedAddress = async (req, res, next) => {
  const { label, address, latitude, longitude, isFavorite } = req.body;

  try {
    const user = await User.findById(req.user._id);
    const target = user.savedAddresses.id(req.params.addressId);

    if (!target) {
      return res.status(404).json({
        error: { message: 'Address not found' },
      });
    }

    if (label) target.label = label;
    if (address) target.address = address;
    if (latitude) target.latitude = parseFloat(latitude);
    if (longitude) target.longitude = parseFloat(longitude);
    if (typeof isFavorite === 'boolean') target.isFavorite = isFavorite;

    await user.save();

    res.status(200).json({
      success: true,
      address: target,
    });
  } catch (err) {
    next(err);
  }
};

const deleteSavedAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const target = user.savedAddresses.id(req.params.addressId);

    if (!target) {
      return res.status(404).json({
        error: { message: 'Address not found' },
      });
    }

    target.remove();
    await user.save();

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
};