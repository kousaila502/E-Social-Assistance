const express = require('express');
const router = express.Router();
const {
  authenticateUser
} = require('../middleware/authentication');

const {
    getAllNotification,
    getSingleNotification,
    updateNotificationStatus
} = require('../controllers/notification');


router
  .route('/emp')
  .get(authenticateUser, getAllNotification);

router
  .route('/emp/:id')
  .get(authenticateUser,getSingleNotification)
  .patch(authenticateUser,updateNotificationStatus);;



module.exports = router;
