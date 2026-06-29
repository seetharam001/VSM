const { Op } = require('sequelize');
const { Vehicle, Customer } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const path = require('path');
const fs = require('fs');

// GET /api/vehicles (customer gets own, admin gets all)
const getVehicles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ where: { userId: req.user.id } });
      if (!customer) return errorResponse(res, 'Customer profile not found', 404);
      where.customerId = customer.id;
    }
    if (search) {
      where[Op.or] = [
        { registrationNumber: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Vehicle.findAndCountAll({
      where,
      include: [{ model: Customer, as: 'customer' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/vehicles/:id
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [{ model: Customer, as: 'customer' }],
    });
    if (!vehicle) return errorResponse(res, 'Vehicle not found', 404);

    // Customers can only see their own vehicle
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ where: { userId: req.user.id } });
      if (!customer || vehicle.customerId !== customer.id) {
        return errorResponse(res, 'Access denied', 403);
      }
    }
    return successResponse(res, vehicle);
  } catch (err) {
    next(err);
  }
};

// POST /api/vehicles
const createVehicle = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) return errorResponse(res, 'Customer profile not found', 404);

    const { registrationNumber, brand, model, fuelType, manufacturingYear, color, engineNumber, chassisNumber } = req.body;

    const existing = await Vehicle.findOne({ where: { registrationNumber } });
    if (existing) return errorResponse(res, 'Registration number already registered', 409);

    const image = req.file ? `/uploads/vehicles/${req.file.filename}` : null;

    const vehicle = await Vehicle.create({
      customerId: customer.id, registrationNumber, brand, model, fuelType,
      manufacturingYear: parseInt(manufacturingYear), color, engineNumber, chassisNumber, image,
    });

    return successResponse(res, vehicle, 'Vehicle registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/vehicles/:id
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return errorResponse(res, 'Vehicle not found', 404);

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ where: { userId: req.user.id } });
      if (!customer || vehicle.customerId !== customer.id) {
        return errorResponse(res, 'Access denied', 403);
      }
    }

    const { brand, model, fuelType, manufacturingYear, color, engineNumber, chassisNumber } = req.body;
    let image = vehicle.image;
    if (req.file) {
      // Delete old image
      if (vehicle.image) {
        const oldPath = path.join(__dirname, '../../', vehicle.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image = `/uploads/vehicles/${req.file.filename}`;
    }

    await vehicle.update({ brand, model, fuelType, manufacturingYear: parseInt(manufacturingYear), color, engineNumber, chassisNumber, image });
    return successResponse(res, vehicle, 'Vehicle updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/vehicles/:id
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return errorResponse(res, 'Vehicle not found', 404);

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ where: { userId: req.user.id } });
      if (!customer || vehicle.customerId !== customer.id) {
        return errorResponse(res, 'Access denied', 403);
      }
    }

    await vehicle.destroy();
    return successResponse(res, null, 'Vehicle deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle };
