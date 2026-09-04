const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
  triggerSos,
  shareLiveLocation,
  resolveSos,
  getSosEvents,
} = require('../controllers/sosController');

router.use(protect);

router.route('/contacts')
  .get(getEmergencyContacts)
  .post(addEmergencyContact);

router.route('/contacts/:contactId')
  .delete(removeEmergencyContact);

router.post('/trigger', triggerSos);
router.post('/share-location', shareLiveLocation);
router.get('/events', getSosEvents);
router.put('/events/:sosId/resolve', authorize('admin'), resolveSos);

module.exports = router;
