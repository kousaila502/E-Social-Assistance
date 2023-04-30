const express = require('express');
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication'); 
const {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
  deleteUsers,
  deleteSingleUser
} = require('../controllers/userController');

router.route('/').get(authenticateUser, authorizePermissions('admin'), getAllUsers);

router.route('/showMe').get(authenticateUser, showCurrentUser);
router.route('/updateUser').patch(authenticateUser, updateUser);
router.route('/updateUserPassword').patch(authenticateUser, updateUserPassword);

router.route('/:id').get(authenticateUser, getSingleUser);
router.route('/deleteUsers').delete(authenticateUser,authorizePermissions('admin'), deleteUsers);
router.route('/deleteSingleUser/:id').delete(authenticateUser,authorizePermissions('admin'), deleteSingleUser);

module.exports = router;
