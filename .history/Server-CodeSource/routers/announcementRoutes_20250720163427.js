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
  reviewApplication
} = require('../controllers/');

// All routes require authentication
router.use(authenticateUser);

// Main announcement routes
router.route('/')
  .get(getAllAnnouncements)
  .post(authorizePermissions('admin', 'case_worker'), createAnnouncement);

// Statistics (staff only)
router.route('/stats')
  .get(authorizePermissions('admin', 'case_worker'), getAnnouncementStats);

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

module.exports = router;
