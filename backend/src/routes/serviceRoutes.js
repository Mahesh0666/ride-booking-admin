const express = require('express');
const router = express.Router();
const { getServices, getService } = require('../controllers/serviceController');

router.route('/')
  .get(getServices);

router.route('/:code')
  .get(getService);

module.exports = router;
