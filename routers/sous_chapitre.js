const express = require('express');
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  createSousChapitre,
  getAllSousChapitres,
  getSingleSousChapitre,
  updateSousChapitre,
  updateStatusSousChapitre
} = require('../controllers/sous_chapitre');


router
  .route('/emp')
  .get(authenticateUser, getAllSousChapitres);

router
.route('/admin')
.post([authenticateUser, authorizePermissions('admin')],createSousChapitre)
.get([authenticateUser, authorizePermissions('admin')],getAllSousChapitres);

router
  .route('/emp/:id')
  .get(authenticateUser,getSingleSousChapitre);

router
.route('/admin/:id')
.get([authenticateUser, authorizePermissions('admin')], getSingleSousChapitre)
/*.patch([authenticateUser, authorizePermissions('admin')], updateSousChapitre);*/

router
.route('/admin/statusUpdate')
.patch([authenticateUser, authorizePermissions('admin')], updateStatusSousChapitre);

module.exports = router;
