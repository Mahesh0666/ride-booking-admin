const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  requestPayout,
  getMyPayouts,
  getAllPayouts,
  processPayout,
  getDriverEarnings,
} = require('../controllers/payoutController');

router.use(protect);

router.post('/request', authorize('driver'), requestPayout);
router.get('/my-payouts', authorize('driver'), getMyPayouts);
router.get('/earnings', authorize('driver'), getDriverEarnings);
router.get('/all', authorize('admin'), getAllPayouts);
router.put('/:payoutId/process', authorize('admin'), processPayout);

module.exports = router;
