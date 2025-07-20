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
