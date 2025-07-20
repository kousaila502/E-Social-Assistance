const express = require('express');
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  createDemande,
  getAllDemande,
  getMyDemandes,
  getSingleDemande,
  getMySingleDemande,
  updateDemande,
  updateMyDemande
} = require('../controllers/demande');


// All routes require authentication
router.use(authenticateUser);

// Main demande routes
router.route('/')
  .get(getAllDemande)
  .post(createDemande);

// Individual demande operations
router.route('/:id')
  .get(getSingleDemande)
  .patch(updateDemande);

// Legacy routes for backward compatibility
router.route('/emp')
  .post(createDemande)
  .get(getMyDemandes);

router.route('/admin')
  .get(authorizePermissions('admin'), getAllDemande);

router.route('/emp/:id')
  .get(getMySingleDemande)
  .patch(updateMyDemande);

router.route('/admin/:id')
  .get(authorizePermissions('admin'), getSingleDemande)
  .patch(authorizePermissions('admin'), updateDemande);

module.exports = router;
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
  .post(authorizePermissions('admin', 'case_worker'), requestDocuments);

// Legacy routes for backward compatibility
router.route('/emp')
  .post(createDemande)
  .get(getMyDemandes);

router.route('/admin')
  .get(authorizePermissions('admin'), getAllDemande);

router.route('/emp/:id')
  .get(getMySingleDemande)
  .patch(updateMyDemande);

router.route('/admin/:id')
  .get(authorizePermissions('admin'), getSingleDemande)
  .patch(authorizePermissions('admin'), updateDemande);

module.exports = router;
