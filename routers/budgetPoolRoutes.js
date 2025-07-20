const express = require('express');
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  createBudgetPool,
  getAllBudgetPools,
  getSingleBudgetPool,
  updateBudgetPool,
  allocateFunds,
  transferFunds,
  getDashboardStats,
  getPoolAnalytics,
  deleteBudgetPool
} = require('../controllers/budgetPoolController');

// All routes require authentication and admin/finance_manager permissions
router.use(authenticateUser);
router.use(authorizePermissions('admin', 'finance_manager'));

// Main budget pool routes
router.route('/')
  .get(getAllBudgetPools)
  .post(createBudgetPool);

// Dashboard and statistics
router.route('/dashboard-stats')
  .get(getDashboardStats);

// Individual budget pool operations
router.route('/:id')
  .get(getSingleBudgetPool)
  .patch(updateBudgetPool)
  .delete(deleteBudgetPool);

// Budget pool workflow actions
router.route('/:id/allocate')
  .post(allocateFunds);

router.route('/:id/transfer')
  .post(transferFunds);

// Analytics
router.route('/:id/analytics')
  .get(getPoolAnalytics);

module.exports = router;