const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  getMechanics, getMechanicById, createMechanic, updateMechanic, deleteMechanic, getMechanicBookings, getMechanicDashboard,
} = require('../controllers/mechanicController');

// Admin endpoints
router.get('/', authenticate, getMechanics);
router.get('/dashboard', authenticate, authorize('mechanic'), getMechanicDashboard);
router.get('/:id', authenticate, getMechanicById);
router.post('/', authenticate, authorize('admin'), createMechanic);
router.put('/:id', authenticate, authorize('admin', 'mechanic'), updateMechanic);
router.delete('/:id', authenticate, authorize('admin'), deleteMechanic);
router.get('/:id/bookings', authenticate, getMechanicBookings);

module.exports = router;
