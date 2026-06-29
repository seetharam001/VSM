const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  getCustomers, getCustomerById, toggleCustomerStatus,
  getDashboardStats, getMonthlyReport, getPopularServices, getTopMechanics, globalSearch,
} = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.put('/customers/:id/toggle-status', toggleCustomerStatus);
router.get('/reports/monthly', getMonthlyReport);
router.get('/reports/popular-services', getPopularServices);
router.get('/reports/top-mechanics', getTopMechanics);
router.get('/search', globalSearch);

module.exports = router;
