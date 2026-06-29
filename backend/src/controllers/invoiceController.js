const { Invoice, InvoiceItem, Booking, Customer, Vehicle, Service, Mechanic, User } = require('../models');
const { notifyInvoiceGenerated, notifyPaymentReceived } = require('../utils/notifications');
const { successResponse, errorResponse } = require('../utils/response');

// GET /api/invoices/:id
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Booking, as: 'booking',
          include: [
            { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email'] }] },
            { model: Vehicle, as: 'vehicle' },
            { model: Service, as: 'service' },
            { model: Mechanic, as: 'mechanic' },
          ],
        },
        { model: InvoiceItem, as: 'items' },
      ],
    });
    if (!invoice) return errorResponse(res, 'Invoice not found', 404);
    return successResponse(res, invoice);
  } catch (err) {
    next(err);
  }
};

// GET /api/invoices/booking/:bookingId
const getInvoiceByBooking = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      where: { bookingId: req.params.bookingId },
      include: [
        {
          model: Booking, as: 'booking',
          include: [
            { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email'] }] },
            { model: Vehicle, as: 'vehicle' },
            { model: Service, as: 'service' },
            { model: Mechanic, as: 'mechanic' },
          ],
        },
        { model: InvoiceItem, as: 'items' },
      ],
    });
    if (!invoice) return errorResponse(res, 'Invoice not found', 404);
    return successResponse(res, invoice);
  } catch (err) {
    next(err);
  }
};

// POST /api/invoices (admin generates invoice)
const generateInvoice = async (req, res, next) => {
  try {
    const { bookingId, serviceCharge, labourCharge, partsCharge, gstRate, discount, notes, items } = req.body;

    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user' }] },
        { model: Service, as: 'service' },
      ],
    });
    if (!booking) return errorResponse(res, 'Booking not found', 404);
    if (booking.status !== 'Completed') return errorResponse(res, 'Can only generate invoice for completed bookings', 400);

    const existing = await Invoice.findOne({ where: { bookingId } });
    if (existing) return errorResponse(res, 'Invoice already exists for this booking', 409);

    const invoice = await Invoice.create({
      bookingId,
      serviceCharge: parseFloat(serviceCharge) || booking.service?.basePrice || 0,
      labourCharge: parseFloat(labourCharge) || 0,
      partsCharge: parseFloat(partsCharge) || 0,
      gstRate: parseFloat(gstRate) || 18,
      discount: parseFloat(discount) || 0,
      notes,
    });

    // Create line items
    if (items && items.length) {
      await InvoiceItem.bulkCreate(items.map(item => ({ ...item, invoiceId: invoice.id })));
    }

    // Notify customer
    const customerUserId = booking.customer?.user?.id;
    if (customerUserId) {
      await notifyInvoiceGenerated(customerUserId, invoice.invoiceNumber);
    }

    const fullInvoice = await Invoice.findByPk(invoice.id, { include: [{ model: InvoiceItem, as: 'items' }] });
    return successResponse(res, fullInvoice, 'Invoice generated', 201);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/invoices/:id/payment
const updatePayment = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [{ model: Booking, as: 'booking', include: [{ model: Customer, as: 'customer', include: [{ model: User, as: 'user' }] }] }],
    });
    if (!invoice) return errorResponse(res, 'Invoice not found', 404);

    const { paymentStatus, paymentMethod } = req.body;
    const updates = { paymentStatus, paymentMethod };
    if (paymentStatus === 'Paid') updates.paidAt = new Date();

    await invoice.update(updates);

    if (paymentStatus === 'Paid') {
      const customerUserId = invoice.booking?.customer?.user?.id;
      if (customerUserId) {
        await notifyPaymentReceived(customerUserId, invoice.invoiceNumber);
      }
    }

    return successResponse(res, invoice, 'Payment updated');
  } catch (err) {
    next(err);
  }
};

// PUT /api/invoices/:id
const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return errorResponse(res, 'Invoice not found', 404);
    if (invoice.paymentStatus === 'Paid') return errorResponse(res, 'Cannot edit a paid invoice', 400);

    const { serviceCharge, labourCharge, partsCharge, gstRate, discount, notes } = req.body;
    await invoice.update({ serviceCharge, labourCharge, partsCharge, gstRate, discount, notes });
    return successResponse(res, invoice, 'Invoice updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getInvoiceById, getInvoiceByBooking, generateInvoice, updatePayment, updateInvoice };
