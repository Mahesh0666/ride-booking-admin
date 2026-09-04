const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  getUser,
  updateUserStatus,
  getRideStats,
  getAllDrivers,
  reviewDriver,
  getAllPayments,
  getAllRides,
  deleteUser,
  deleteDriver,
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('admin'));

router.route('/stats')
  .get(getRideStats);

router.route('/users')
  .get(getAllUsers);

router.route('/drivers')
  .get(getAllDrivers);

router.route('/drivers/:id/review')
  .put(reviewDriver);

router.route('/payments')
  .get(getAllPayments);

router.route('/users/:id')
  .get(getUser)
  .put(updateUserStatus)
  .delete(deleteUser);

router.route('/drivers/:id')
  .delete(deleteDriver);

router.route('/rides')
  .get(getAllRides);

module.exports = router;