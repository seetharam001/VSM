const { Op } = require('sequelize');
const { User, Customer, Booking, Vehicle, Invoice } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// GET /api/admin/customers
const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const offset = (page - 1) * limit;

    const userWhere = {};
    if (status === 'active') userWhere.isActive = true;
    if (status === 'inactive') userWhere.isActive = false;

    const customerWhere = {};
    if (search) {
      customerWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: customerWhere,
      include: [{ model: User, as: 'user', where: userWhere, attributes: { exclude: ['password', 'refreshToken', 'resetPasswordToken'] } }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/customers/:id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password', 'refreshToken', 'resetPasswordToken'] } },
        { model: Vehicle, as: 'vehicles' },
        { model: Booking, as: 'bookings', limit: 5, order: [['createdAt', 'DESC']] },
      ],
    });
    if (!customer) return errorResponse(res, 'Customer not found', 404);
    return successResponse(res, customer);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/customers/:id/toggle-status
const toggleCustomerStatus = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }],
    });
    if (!customer) return errorResponse(res, 'Customer not found', 404);
    await customer.user.update({ isActive: !customer.user.isActive });
    return successResponse(res, null, `Customer ${customer.user.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const { Mechanic, Service } = require('../models');
    const [customers, mechanics, vehicles, services, bookings, completedBookings, pendingBookings] = await Promise.all([
      Customer.count(),
      Mechanic.count(),
      Vehicle.count(),
      Service.count({ where: { isActive: true } }),
      Booking.count(),
      Booking.count({ where: { status: 'Completed' } }),
      Booking.count({ where: { status: 'Pending' } }),
    ]);

    // Monthly revenue
    const { sequelize } = require('../models/index');
    const invoices = await Invoice.findAll({ where: { paymentStatus: 'Paid' } });
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    return successResponse(res, {
      customers, mechanics, vehicles, services,
      totalBookings: bookings,
      completedBookings, pendingBookings,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reports/monthly
const getMonthlyReport = async (req, res, next) => {
  try {
    const sequelize = require('../config/database');
    const { QueryTypes } = require('sequelize');

    const bookingData = await sequelize.query(
      `SELECT strftime('%Y-%m', createdAt) as month, COUNT(*) as total, status
       FROM bookings
       WHERE createdAt >= date('now', '-12 months')
       GROUP BY month, status
       ORDER BY month ASC`,
      { type: QueryTypes.SELECT }
    );

    const revenueData = await sequelize.query(
      `SELECT strftime('%Y-%m', i.createdAt) as month, SUM(i.grandTotal) as revenue
       FROM invoices i
       WHERE i.paymentStatus = 'Paid' AND i.createdAt >= date('now', '-12 months')
       GROUP BY month
       ORDER BY month ASC`,
      { type: QueryTypes.SELECT }
    );

    return successResponse(res, { bookings: bookingData, revenue: revenueData });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reports/popular-services
const getPopularServices = async (req, res, next) => {
  try {
    const sequelize = require('../config/database');
    const { QueryTypes } = require('sequelize');
    const data = await sequelize.query(
      `SELECT s.name, COUNT(b.id) as bookings
       FROM services s
       LEFT JOIN bookings b ON b.serviceId = s.id
       GROUP BY s.id, s.name
       ORDER BY bookings DESC
       LIMIT 10`,
      { type: QueryTypes.SELECT }
    );
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reports/top-mechanics
const getTopMechanics = async (req, res, next) => {
  try {
    const sequelize = require('../config/database');
    const { QueryTypes } = require('sequelize');
    const data = await sequelize.query(
      `SELECT m.name, COUNT(b.id) as completedJobs
       FROM mechanics m
       LEFT JOIN bookings b ON b.mechanicId = m.id AND b.status = 'Completed'
       GROUP BY m.id, m.name
       ORDER BY completedJobs DESC
       LIMIT 10`,
      { type: QueryTypes.SELECT }
    );
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/search
const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return successResponse(res, { customers: [], bookings: [], invoices: [] });

    const [customers, bookings, invoices] = await Promise.all([
      Customer.findAll({
        where: { name: { [Op.like]: `%${q}%` } },
        limit: 5,
        include: [{ model: User, as: 'user', attributes: ['email'] }],
      }),
      Booking.findAll({
        where: { bookingNumber: { [Op.like]: `%${q}%` } },
        limit: 5,
      }),
      Invoice.findAll({
        where: { invoiceNumber: { [Op.like]: `%${q}%` } },
        limit: 5,
      }),
    ]);

    return successResponse(res, { customers, bookings, invoices });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomers, getCustomerById, toggleCustomerStatus,
  getDashboardStats, getMonthlyReport, getPopularServices, getTopMechanics,
  globalSearch,
};
