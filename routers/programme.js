const express = require('express');
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  createProgramme,
  getProgramme
} = require('../controllers/programme');


router
  .route('/emp')
  .get(authenticateUser, getProgramme);

router
.route('/admin')
.post([authenticateUser, authorizePermissions('admin')],createProgramme)
.get([authenticateUser, authorizePermissions('admin')],getProgramme);



module.exports = router;
