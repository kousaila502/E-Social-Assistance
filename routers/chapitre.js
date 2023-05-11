const express = require('express');
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  createChapitre,
  getAllChapitres,
  getSingleChapitre,
  updateChapitre
} = require('../controllers/chapitre');


router
  .route('/emp')
  .get(authenticateUser, getAllChapitres);

router
.route('/admin')
.post([authenticateUser, authorizePermissions('admin')],createChapitre)
.get([authenticateUser, authorizePermissions('admin')],getAllChapitres);

router
  .route('/emp/:id')
  .get(authenticateUser,getSingleChapitre);

router
.route('/admin/:id')
.get([authenticateUser, authorizePermissions('admin')], getSingleChapitre)
.patch([authenticateUser, authorizePermissions('admin')], updateChapitre);


module.exports = router;
