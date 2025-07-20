const express = require('express');
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  createDemande,
  submitDemande,
  getAllDemandes,
  getSingleDemande,
  updateDemande,
  reviewDemande,
  assignDemande,
  addComment,
  cancelDemande,
  getDashboardStats,
  uploadDocuments,
  verifyDocument,
  requestAdditionalDocuments,
  getDemandesByStatus,
  exportDemandes
} = require('../controllers/demandeController');

// All routes require authentication
router.use(authenticateUser);

// Main demande routes
router.route('/')
  .get(getAllDemandes)
  .post(createDemande);

// Dashboard and statistics
router.route('/dashboard-stats')
  .get(authorizePermissions('admin', 'case_worker', 'finance_manager'), getDashboardStats);

// Filter by status
router.route('/status/:status')
  .get(getDemandesByStatus);

// Export functionality
router.route('/export')
  .get(authorizePermissions('admin', 'case_worker', 'finance_manager'), exportDemandes);

// Individual demande operations
router.route('/:id')
  .get(getSingleDemande)
  .patch(updateDemande);

// Demande workflow actions
router.route('/:id/submit')
  .post(submitDemande);

router.route('/:id/review')
  .patch(authorizePermissions('admin', 'case_worker'), reviewDemande);

router.route('/:id/assign')
  .patch(authorizePermissions('admin', 'case_worker'), assignDemande);

router.route('/:id/cancel')
  .patch(cancelDemande);

// Comments system
router.route('/:id/comments')
  .post(addComment);

// Document management
router.route('/:id/documents')
  .post(uploadDocuments);

router.route('/:id/documents/:documentId')
  .patch(authorizePermissions('admin', 'case_worker'), verifyDocument);

router.route('/:id/request-documents')
  .post(authorizePermissions('admin', 'case_worker'), requestAdditionalDocuments);

module.exports = router;