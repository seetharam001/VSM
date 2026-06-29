const { Op } = require('sequelize');
const {
  Booking, Customer, Vehicle, Service, Mechanic, Invoice, RepairNote, User
} = require('../models');
const {
  notifyBookingCreated, notifyBookingApproved,
  notifyMechanicAssigned, notifyServiceCompleted
} = require('../utils/notifications');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const VALID_TRANSITIONS = {
  'Pending': ['Approved', 'Cancelled'],
  'Approved': ['Mechanic Assigned', 'Cancelled'],
  'Mechanic Assigned': ['Inspection Started', 'Cancelled'],
  'Inspection Started': ['Repair In Progress'],
  'Repair In Progress': ['Waiting for Parts', 'Completed'],
  'Waiting for Parts': ['Repair In Progress', 'Completed'],
  'Completed': [],
  'Cancelled': [],
};

// GET /api/bookings
const getBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, serviceId, mechanicId, date, paymentStatus } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ where: { userId: req.user.id } });
      if (!customer) return errorResponse(res, 'Customer profile not found', 404);
      where.customerId = customer.id;
    }
    if (req.user.role === 'mechanic') {
      const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
      if (!mechanic) return errorResponse(res, 'Mechanic profile not found', 404);
      where.mechanicId = mechanic.id;
    }

    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;
    if (mechanicId) where.mechanicId = mechanicId;
    if (date) where.preferredDate = date;

    const invoiceWhere = {};
    if (paymentStatus) invoiceWhere.paymentStatus = paymentStatus;

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' },
        { model: Service, as: 'service' },
        { model: Mechanic, as: 'mechanic' },
        { model: Invoice, as: 'invoice', where: Object.keys(invoiceWhere).length ? invoiceWhere : undefined, required: false },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user', attributes: ['email'] }] },
        { model: Vehicle, as: 'vehicle' },
        { model: Service, as: 'service' },
        { model: Mechanic, as: 'mechanic' },
        { model: Invoice, as: 'invoice', required: false },
        { model: RepairNote, as: 'repairNotes', order: [['createdAt', 'DESC']] },
      ],
    });
    if (!booking) return errorResponse(res, 'Booking not found', 404);
    return successResponse(res, booking);
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) return errorResponse(res, 'Customer profile not found', 404);

    const { vehicleId, serviceId, preferredDate, problemDescription } = req.body;

    // Validate preferred date is in the future
    if (new Date(preferredDate) < new Date().setHours(0, 0, 0, 0)) {
      return errorResponse(res, 'Preferred date must be today or in the future', 400);
    }

    // Validate vehicle belongs to customer
    const vehicle = await Vehicle.findOne({ where: { id: vehicleId, customerId: customer.id } });
    if (!vehicle) return errorResponse(res, 'Vehicle not found or does not belong to you', 404);

    const service = await Service.findOne({ where: { id: serviceId, isActive: true } });
    if (!service) return errorResponse(res, 'Service not found or inactive', 404);

    const booking = await Booking.create({
      customerId: customer.id, vehicleId, serviceId, preferredDate, problemDescription, status: 'Pending',
    });

    // Notify customer
    await notifyBookingCreated(req.user.id, booking.bookingNumber);

    return successResponse(res, booking, 'Booking created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/bookings/:id/status
const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer', include: [{ model: User, as: 'user' }] },
        { model: Mechanic, as: 'mechanic' },
      ],
    });
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    const { status, mechanicId, adminNotes } = req.body;

    // Validate transition
    const allowed = VALID_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      return errorResponse(res, `Cannot transition from "${booking.status}" to "${status}"`, 400);
    }

    // Customer can only cancel pending bookings
    if (req.user.role === 'customer') {
      if (status !== 'Cancelled' || booking.status !== 'Pending') {
        return errorResponse(res, 'You can only cancel pending bookings', 403);
      }
    }

    const updates = { status };
    if (adminNotes) updates.adminNotes = adminNotes;
    if (status === 'Mechanic Assigned' && mechanicId) updates.mechanicId = mechanicId;
    if (status === 'Completed') updates.completedAt = new Date();

    await booking.update(updates);

    const customerUserId = booking.customer?.user?.id;

    // Send notifications
    if (status === 'Approved' && customerUserId) {
      await notifyBookingApproved(customerUserId, booking.bookingNumber);
    }
    if (status === 'Mechanic Assigned' && mechanicId && customerUserId) {
      const mechanic = await Mechanic.findByPk(mechanicId);
      await notifyMechanicAssigned(customerUserId, booking.bookingNumber, mechanic?.name || 'A mechanic');
    }
    if (status === 'Completed' && customerUserId) {
      await notifyServiceCompleted(customerUserId, booking.bookingNumber);
    }

    return successResponse(res, booking, 'Booking status updated');
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings/:id/repair-notes
const addRepairNote = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) return errorResponse(res, 'Mechanic profile not found', 404);
    if (booking.mechanicId !== mechanic.id) return errorResponse(res, 'Not assigned to this booking', 403);

    const { noteType, content, estimatedCompletion } = req.body;
    const note = await RepairNote.create({ bookingId: booking.id, mechanicId: mechanic.id, noteType, content, estimatedCompletion });

    return successResponse(res, note, 'Repair note added', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/customer/dashboard
const getCustomerDashboard = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) return errorResponse(res, 'Customer profile not found', 404);

    const [vehicles, activeBookings, completedBookings, pendingPayments] = await Promise.all([
      Vehicle.count({ where: { customerId: customer.id } }),
      Booking.count({ where: { customerId: customer.id, status: { [Op.notIn]: ['Completed', 'Cancelled'] } } }),
      Booking.count({ where: { customerId: customer.id, status: 'Completed' } }),
      Invoice.count({
        include: [{ model: Booking, as: 'booking', where: { customerId: customer.id }, required: true }],
        where: { paymentStatus: 'Pending' },
      }),
    ]);

    return successResponse(res, { vehicles, activeBookings, completedBookings, pendingPayments });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBookings, getBookingById, createBooking, updateBookingStatus, addRepairNote, getCustomerDashboard,
};
