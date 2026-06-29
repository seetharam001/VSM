const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Mechanic, Booking, Service, Customer, Vehicle } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// GET /api/mechanics
const getMechanics = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', available } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (available === 'true') where.isAvailable = true;

    const { count, rows } = await Mechanic.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['email', 'isActive'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/mechanics/:id
const getMechanicById = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['email', 'isActive'] }],
    });
    if (!mechanic) return errorResponse(res, 'Mechanic not found', 404);

    const stats = {
      assigned: await Booking.count({ where: { mechanicId: mechanic.id } }),
      completed: await Booking.count({ where: { mechanicId: mechanic.id, status: 'Completed' } }),
      pending: await Booking.count({ where: { mechanicId: mechanic.id, status: ['Mechanic Assigned', 'Inspection Started', 'Repair In Progress', 'Waiting for Parts'] } }),
    };

    return successResponse(res, { ...mechanic.toJSON(), stats });
  } catch (err) {
    next(err);
  }
};

// POST /api/mechanics (admin only)
const createMechanic = async (req, res, next) => {
  try {
    const { name, email, phone, experience, specialization, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return errorResponse(res, 'Email already registered', 409);

    const existingPhone = await Mechanic.findOne({ where: { phone } });
    if (existingPhone) return errorResponse(res, 'Phone number already registered', 409);

    const hashedPassword = await bcrypt.hash(password || 'Mechanic@123', 12);
    const user = await User.create({ email, password: hashedPassword, role: 'mechanic' });
    const mechanic = await Mechanic.create({ userId: user.id, name, phone, experience, specialization });

    return successResponse(res, mechanic, 'Mechanic created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/mechanics/:id
const updateMechanic = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findByPk(req.params.id);
    if (!mechanic) return errorResponse(res, 'Mechanic not found', 404);

    const { name, phone, experience, specialization, isAvailable } = req.body;
    await mechanic.update({ name, phone, experience, specialization, isAvailable });

    return successResponse(res, mechanic, 'Mechanic updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/mechanics/:id
const deleteMechanic = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }],
    });
    if (!mechanic) return errorResponse(res, 'Mechanic not found', 404);

    const activeBookings = await Booking.count({
      where: { mechanicId: mechanic.id, status: { [Op.notIn]: ['Completed', 'Cancelled'] } },
    });
    if (activeBookings > 0) return errorResponse(res, 'Cannot delete mechanic with active bookings', 400);

    await mechanic.user.destroy();
    await mechanic.destroy();
    return successResponse(res, null, 'Mechanic deleted');
  } catch (err) {
    next(err);
  }
};

// GET /api/mechanics/:id/bookings (Mechanic dashboard)
const getMechanicBookings = async (req, res, next) => {
  try {
    const mechanicId = req.params.id || (await Mechanic.findOne({ where: { userId: req.user.id } }))?.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { mechanicId };
    if (status) where.status = status;

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' },
        { model: Service, as: 'service' },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['preferredDate', 'ASC']],
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/mechanics/dashboard (Mechanic's own dashboard)
const getMechanicDashboard = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) return errorResponse(res, 'Mechanic profile not found', 404);

    const today = new Date().toISOString().split('T')[0];
    const [assigned, completed, pending, todayJobs] = await Promise.all([
      Booking.count({ where: { mechanicId: mechanic.id } }),
      Booking.count({ where: { mechanicId: mechanic.id, status: 'Completed' } }),
      Booking.count({ where: { mechanicId: mechanic.id, status: { [Op.notIn]: ['Completed', 'Cancelled'] } } }),
      Booking.count({ where: { mechanicId: mechanic.id, preferredDate: today } }),
    ]);

    return successResponse(res, { mechanic, stats: { assigned, completed, pending, todayJobs } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMechanics, getMechanicById, createMechanic, updateMechanic, deleteMechanic, getMechanicBookings, getMechanicDashboard };
