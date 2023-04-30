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
  updateMyDemande,
  deleteMyDemande,
} = require('../controllers/demande');


router
  .route('/emp')
  .post(authenticateUser, createDemande)
  .get(authenticateUser,getMyDemandes);

router
.route('/admin')
.get([authenticateUser, authorizePermissions('admin')],getAllDemande);

router
  .route('/emp/:id')
  .get(authenticateUser, getMySingleDemande)
  .patch(authenticateUser, updateMyDemande)
  .delete(authenticateUser, deleteMyDemande);

router
.route('/admin/:id')
.get([authenticateUser, authorizePermissions('admin')], getSingleDemande)
.patch([authenticateUser, authorizePermissions('admin')], updateDemande);


module.exports = router;
