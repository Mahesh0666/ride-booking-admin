const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
} = require('../controllers/addressController');

router.use(protect);

router.route('/')
  .get(getSavedAddresses)
  .post(addSavedAddress);

router.route('/:addressId')
  .put(updateSavedAddress)
  .delete(deleteSavedAddress);

module.exports = router;