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
  updateSousChapitre
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
  .get(authenticateUser,getSingleChapitre);

router
.route('/admin/:id')
.get([authenticateUser, authorizePermissions('admin')], getSingleSousChapitre)
.patch([authenticateUser, authorizePermissions('admin')], updateSousChapitre);


module.exports = router;
