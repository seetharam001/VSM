const { Op } = require('sequelize');
const { Notification } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;
    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    const unreadCount = await Notification.count({ where: { userId: req.user.id, isRead: false } });

    return res.json({
      success: true,
      data: rows,
      unreadCount,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notification) return errorResponse(res, 'Notification not found', 404);
    await notification.update({ isRead: true });
    return successResponse(res, notification, 'Marked as read');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/mark-all-read
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    return successResponse(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notification) return errorResponse(res, 'Notification not found', 404);
    await notification.destroy();
    return successResponse(res, null, 'Notification deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
