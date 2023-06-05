const express = require('express');
const router = express.Router();
const {
  authenticateUser
} = require('../middleware/authentication');

const {
    getAllNotification,
    getSingleNotification
} = require('../controllers/notification');


router
  .route('/emp')
  .get(authenticateUser, getAllNotification);

router
  .route('/emp/:id')
  .get(authenticateUser,getSingleNotification);



module.exports = router;
