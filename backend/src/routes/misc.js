const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');
const { createFeedback, getFeedback, replyFeedback, updateFeedbackStatus, updateProfile, changePassword } = require('../controllers/feedbackController');
const { uploadAvatar } = require('../middlewares/upload');

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/mark-all-read', authenticate, markAllAsRead);
router.patch('/notifications/:id/read', authenticate, markAsRead);
router.delete('/notifications/:id', authenticate, deleteNotification);

// Feedback
router.post('/feedback', authenticate, authorize('customer'), createFeedback);
router.get('/feedback', authenticate, getFeedback);
router.put('/feedback/:id/reply', authenticate, authorize('admin'), replyFeedback);
router.patch('/feedback/:id/status', authenticate, authorize('admin'), updateFeedbackStatus);

// Profile
router.put('/profile', authenticate, uploadAvatar, updateProfile);
router.put('/profile/change-password', authenticate, changePassword);

module.exports = router;
