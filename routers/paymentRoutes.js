const express = require('express');
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  getAllPayments,
  createPayment,
  getDashboardStats,
  getSinglePayment,
  updatePayment,
  processPayment,
  cancelPayment,
  retryPayment,
} = require('../controllers/paymentController');


// All routes require authentication
router.use(authenticateUser);

// Main payment routes
router.route('/')
  .get(getAllPayments)
  .post(authorizePermissions('admin', 'finance_manager'), createPayment);

// Dashboard and statistics
router.route('/dashboard-stats')
  .get(authorizePermissions('admin', 'finance_manager'), getDashboardStats);

// Individual payment operations
router.route('/:id')
  .get(getSinglePayment)
  .patch(authorizePermissions('admin', 'finance_manager'), updatePayment);

// Payment workflow actions
router.route('/:id/process')
  .post(authorizePermissions('admin', 'finance_manager'), processPayment);

router.route('/:id/cancel')
  .post(authorizePermissions('admin', 'finance_manager'), cancelPayment);

router.route('/:id/retry')
  .post(authorizePermissions('admin', 'finance_manager'), retryPayment);


module.exports = router;
