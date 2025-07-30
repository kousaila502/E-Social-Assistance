const express = require('express');
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  restoreUser,
  verifyDocuments,
  calculateEligibility,
  bulkUpdateUsers,
  dashboardStatsUsers,
  uploadDocument,
  getUserDocuments,
  deleteDocument,
} = require('../controllers/userController');

// FIX: Import the correct upload middleware
const { uploadUserDocument } = require('../middleware/upload');

// All routes require authentication
router.use(authenticateUser);

// Admin/case_worker only routes
router.route('/')
  .get(authorizePermissions('admin', 'case_worker'), getAllUsers);

router.route('/dashboard-stats')
  .get(authorizePermissions('admin', 'case_worker'), dashboardStatsUsers);

// REMOVE: createUser route since the function doesn't exist
// router.route('/create')
//   .post(authorizePermissions('admin'), createUser);

// Get user by ID
router.route('/:id')
  .get(getSingleUser)
  .patch(updateUser)
  .delete(authorizePermissions('admin'), deleteUser);

// Restore user (admin only)
router.route('/:id/restore')
  .patch(authorizePermissions('admin'), restoreUser);

// Verify documents (case_worker/admin only)
router.route('/:id/verify-documents')
  .patch(authorizePermissions('admin', 'case_worker'), verifyDocuments);

// Calculate eligibility (case_worker/admin only)
router.route('/:id/calculate-eligibility')
  .post(authorizePermissions('admin', 'case_worker'), calculateEligibility);

// Bulk update users (admin only)
router.route('/bulk-update')
  .patch(authorizePermissions('admin'), bulkUpdateUsers);

// Document management routes
router.route('/:id/documents/upload')
  .post(uploadUserDocument, uploadDocument);

router.route('/:id/documents')
  .get(getUserDocuments);

router.route('/:id/documents/:docType')
  .delete(deleteDocument);

  

module.exports = router;