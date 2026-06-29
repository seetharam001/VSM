const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  getBookings, getBookingById, createBooking, updateBookingStatus, addRepairNote, getCustomerDashboard,
} = require('../controllers/bookingController');

router.get('/customer/dashboard', authenticate, authorize('customer'), getCustomerDashboard);
router.get('/', authenticate, getBookings);
router.get('/:id', authenticate, getBookingById);
router.post('/', authenticate, authorize('customer'), createBooking);
router.patch('/:id/status', authenticate, updateBookingStatus);
router.post('/:id/repair-notes', authenticate, authorize('mechanic'), addRepairNote);

module.exports = router;
