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
} = require('../controllers/userController');

// All routes require authentication
router.use(authenticateUser);

// Admin/case_worker only routes
router.route('/')
  .get(authorizePermissions('admin', 'case_worker'), getAllUsers);

router.route('/dashboard-stats')
  .get(authorizePermissions('admin'), dashboardStatsUsers);

router.route('/:id')
  .get(authorizePermissions('admin', 'case_worker'), getSingleUser)
  .patch(authorizePermissions('admin', 'case_worker'), updateUser)
  .delete(authorizePermissions('admin', 'case_worker'), deleteUser);

// Additional user management routes
router.route('/:id/restore')
  .patch(authorizePermissions('admin'), restoreUser);

router.route('/:id/verify-documents')
  .patch(authorizePermissions('admin', 'case_worker'), verifyDocuments);

router.route('/:id/calculate-eligibility')
  .patch(authorizePermissions('admin', 'case_worker'), calculateEligibility);

router.route('/bulk-update')
  .patch(authorizePermissions('admin'), bulkUpdateUsers);


module.exports = router;