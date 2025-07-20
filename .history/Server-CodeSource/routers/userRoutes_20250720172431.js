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
  deleteUser
} = require('../controllers/userController');

// All routes require authentication
router.use(authenticateUser);

// Admin/case_worker only routes
router.route('/')
  .get(authorizePermissions('admin', 'case_worker'), getAllUsers);

router.route('/:id')
  .get(authorizePermissions('admin', 'case_worker'), getSingleUser)
  .patch(authorizePermissions('admin', 'case_worker'), updateUser)
  .delete(authorizePermissions('admin', 'case_worker'), deleteUser);

// User profile routes (any authenticated user)
router.route('/showMe').get(showCurrentUser);
router.route('/updateUser').patch(updateUser);
router.route('/updateUserPassword').patch(updateUserPassword);

module.exports = router;
