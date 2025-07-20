const express = require('express');
const router = express.Router();

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  getAllBudgetPools,
  createBudgetPool,
  getDashboardStats,
  getSingleBudgetPool,
  updateBudgetPool,
  activateBudgetPool,
  allocateFunds,
  transferFunds,
  getPoolAnalytics,
  deleteBudgetPool,
  
  // Legacy functions for backward compatibility
  getBudget,
  pushBudget,
  popBudget,
  createBudget
} = require('../controllers/budgetPool');

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
router.route('/:id/activate')
  .post(activateBudgetPool);

router.route('/:id/allocate')
  .post(allocateFunds);

router.route('/:id/transfer')
  .post(transferFunds);

// Analytics
router.route('/:id/analytics')
  .get(getPoolAnalytics);

// Legacy routes for backward compatibility
router.route('/legacy')
  .get(getBudget)
  .post(createBudget);

router.route('/legacy/:id/push')
  .post(pushBudget);

router.route('/legacy/:id/pop')
  .post(popBudget);

module.exports = router;
