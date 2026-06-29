const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { getServices, getServiceById, createService, updateService, deleteService, toggleService } = require('../controllers/serviceController');

router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', authenticate, authorize('admin'), createService);
router.put('/:id', authenticate, authorize('admin'), updateService);
router.delete('/:id', authenticate, authorize('admin'), deleteService);
router.patch('/:id/toggle', authenticate, authorize('admin'), toggleService);

module.exports = router;
