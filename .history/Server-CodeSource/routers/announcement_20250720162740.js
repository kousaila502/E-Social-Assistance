const express = require('express');
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  getAllAnnouncements,
  createAnnouncement,
  getAnnouncementStats,
  getSingleAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  applyToAnnouncement,
  reviewApplication,
  sendBulkAnnouncements,
  createAnnouncementTemplate,
  processScheduledAnnouncements,
  cleanExpiredAnnouncements,
  retryFailedAnnouncements,
  markAnnouncementAsRead,
  markAnnouncementAsClicked,
} = require('../controllers/annoncements');

// All routes require authentication
router.use(authenticateUser);

// Main announcement routes
router.route('/')
  .get(getAllAnnouncements)
  .post(authorizePermissions('admin', 'case_worker'), createAnnouncement);

// Statistics (staff only)
router.route('/stats')
  .get(authorizePermissions('admin', 'case_worker'), getAnnouncementStats);

// Bulk operations (staff only)
router.route('/bulk')
  .post(authorizePermissions('admin', 'case_worker'), sendBulkAnnouncements);

// User-specific announcements (any authenticated user)
router.route('/user-notifications')
  .get(getUserAnnouncements);

// Admin-only system operations
router.route('/templates')
  .post(authorizePermissions('admin'), createAnnouncementTemplate);

router.route('/process-scheduled')
  .post(authorizePermissions('admin'), processScheduledAnnouncements);

router.route('/clean-expired')
  .post(authorizePermissions('admin'), cleanExpiredAnnouncements);

router.route('/retry-failed')
  .post(authorizePermissions('admin'), retryFailedAnnouncements);

// Individual announcement operations
router.route('/:id')
  .get(getSingleAnnouncement)
  .patch(authorizePermissions('admin', 'case_worker'), updateAnnouncement);

// Announcement workflow actions
router.route('/:id/publish')
  .patch(authorizePermissions('admin', 'case_worker'), publishAnnouncement);

// User participation
router.route('/:id/apply')
  .post(applyToAnnouncement);

// Application review (staff only)
router.route('/:id/participants/:userId/review')
  .patch(authorizePermissions('admin', 'case_worker'), reviewApplication);

// User interaction tracking
router.route('/:id/read')
  .patch(markAnnouncementAsRead);

router.route('/:id/click')
  .patch(markAnnouncementAsClicked);

module.exports = router;
