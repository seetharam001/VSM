const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Feedback, Customer, Booking, User } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// POST /api/feedback
const createFeedback = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ where: { userId: req.user.id } });
    if (!customer) return errorResponse(res, 'Customer profile not found', 404);

    const { bookingId, type, subject, message, rating } = req.body;

    if (bookingId) {
      const booking = await Booking.findOne({ where: { id: bookingId, customerId: customer.id } });
      if (!booking) return errorResponse(res, 'Booking not found', 404);
    }

    const feedback = await Feedback.create({ customerId: customer.id, bookingId, type, subject, message, rating });
    return successResponse(res, feedback, 'Feedback submitted', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/feedback (admin gets all, customer gets own)
const getFeedback = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ where: { userId: req.user.id } });
      if (customer) where.customerId = customer.id;
    }

    if (type) where.type = type;
    if (status) where.status = status;

    const { count, rows } = await Feedback.findAndCountAll({
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

// PUT /api/feedback/:id/reply (admin)
const replyFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) return errorResponse(res, 'Feedback not found', 404);
    const { adminReply, status } = req.body;
    await feedback.update({ adminReply, status: status || 'Resolved' });
    return successResponse(res, feedback, 'Reply sent');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/feedback/:id/status
const updateFeedbackStatus = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) return errorResponse(res, 'Feedback not found', 404);
    await feedback.update({ status: req.body.status });
    return successResponse(res, feedback, 'Status updated');
  } catch (err) {
    next(err);
  }
};

// PUT /api/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, experience, specialization } = req.body;
    let profile = null;
    let avatar = null;

    if (req.user.role === 'customer') {
      profile = await Customer.findOne({ where: { userId: req.user.id } });
      if (!profile) return errorResponse(res, 'Profile not found', 404);
      avatar = req.file ? `/uploads/avatars/${req.file.filename}` : profile.avatar;
      await profile.update({ name, phone, address, avatar });
    } else if (req.user.role === 'mechanic') {
      const { Mechanic } = require('../models');
      profile = await Mechanic.findOne({ where: { userId: req.user.id } });
      if (!profile) return errorResponse(res, 'Profile not found', 404);
      avatar = req.file ? `/uploads/avatars/${req.file.filename}` : profile.avatar;
      await profile.update({ name, phone, experience, specialization, avatar });
    } else {
      return errorResponse(res, 'Only customers and mechanics can update their profile', 400);
    }

    return successResponse(res, profile, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// PUT /api/profile/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return errorResponse(res, 'Current password is incorrect', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashed });
    return successResponse(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createFeedback, getFeedback, replyFeedback, updateFeedbackStatus, updateProfile, changePassword };
