const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { getInvoiceById, getInvoiceByBooking, generateInvoice, updatePayment, updateInvoice } = require('../controllers/invoiceController');

router.get('/booking/:bookingId', authenticate, getInvoiceByBooking);
router.get('/:id', authenticate, getInvoiceById);
router.post('/', authenticate, authorize('admin'), generateInvoice);
router.put('/:id', authenticate, authorize('admin'), updateInvoice);
router.patch('/:id/payment', authenticate, authorize('admin', 'customer'), updatePayment);

module.exports = router;
