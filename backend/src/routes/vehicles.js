const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadVehicle } = require('../middlewares/upload');
const { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');

router.get('/', authenticate, getVehicles);
router.get('/:id', authenticate, getVehicleById);
router.post('/', authenticate, authorize('customer'), uploadVehicle, createVehicle);
router.put('/:id', authenticate, authorize('customer', 'admin'), uploadVehicle, updateVehicle);
router.delete('/:id', authenticate, authorize('customer', 'admin'), deleteVehicle);

module.exports = router;
