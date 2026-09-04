const Service = require('../models/Service');

const getServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ baseFare: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (err) {
    next(err);
  }
};

const getService = async (req, res, next) => {
  try {
    const service = await Service.findOne({
      $or: [{ code: req.params.code }, { _id: req.params.code }],
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        error: { message: 'Service not found' },
      });
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getServices, getService };
