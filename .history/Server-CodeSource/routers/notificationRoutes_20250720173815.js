const express = require('express');
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  getAllNotifications,
  createNotification,
  getUserNotifications,
  markAsRead,
  markAsClicked,
  sendBulkNotifications,
  retryFailedNotifications,
  getNotificationStats,
  manageTemplates,,
  processScheduledNotifications,
  cleanExpiredNotifications
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticateUser);

// Main notification routes
router.route('/')
  .get(authorizePermissions('admin', 'case_worker', 'finance_manager'), getAllNotifications)
  .post(authorizePermissions('admin', 'case_worker'), createNotification);

// User-specific notifications (any authenticated user)
router.route('/user-notifications')
  .get(getUserNotifications);

// Individual notification actions
router.route('/:id/read')
  .patch(markAsRead);

router.route('/:id/click')
  .patch(markAsClicked);

// Bulk operations (staff only)
router.route('/bulk')
  .post(authorizePermissions('admin', 'case_worker'), sendBulkNotifications);

router.route('/retry-failed')
  .post(authorizePermissions('admin', 'case_worker'), retryFailedNotifications);

// Statistics and analytics (staff only)
router.route('/stats')
  .get(authorizePermissions('admin', 'case_worker', 'finance_manager'), getNotificationStats);

// Template management (admin only)
router.route('/templates')
  .post(authorizePermissions('admin'), createNotificationTemplate);

// System operations (admin only)
router.route('/process-scheduled')
  .post(authorizePermissions('admin'), processScheduledNotifications);

router.route('/clean-expired')
  .post(authorizePermissions('admin'), cleanExpiredNotifications);

module.exports = router;
