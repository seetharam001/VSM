const { Op } = require('sequelize');
const { Service } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// GET /api/services
const getServices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', activeOnly = 'true' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (activeOnly === 'true') where.isActive = true;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Service.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/services/:id
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return errorResponse(res, 'Service not found', 404);
    return successResponse(res, service);
  } catch (err) {
    next(err);
  }
};

// POST /api/services (admin only)
const createService = async (req, res, next) => {
  try {
    const { name, description, estimatedHours, basePrice } = req.body;
    const service = await Service.create({ name, description, estimatedHours, basePrice });
    return successResponse(res, service, 'Service created', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/services/:id
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return errorResponse(res, 'Service not found', 404);
    const { name, description, estimatedHours, basePrice, isActive } = req.body;
    await service.update({ name, description, estimatedHours, basePrice, isActive });
    return successResponse(res, service, 'Service updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/services/:id
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return errorResponse(res, 'Service not found', 404);
    await service.destroy();
    return successResponse(res, null, 'Service deleted');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/services/:id/toggle
const toggleService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return errorResponse(res, 'Service not found', 404);
    await service.update({ isActive: !service.isActive });
    return successResponse(res, service, `Service ${service.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getServices, getServiceById, createService, updateService, deleteService, toggleService };
