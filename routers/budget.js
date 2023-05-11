const express = require('express');
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  getBudget,
  pushBudget,
  popBudget,
  createBudget
} = require('../controllers/budget');


router.route('/getBudget').get(getBudget)
router.route('/createBudget').post(createBudget)
router.route('/pushBudget').patch(pushBudget)
router.route('/popBudget').patch(popBudget);



module.exports = router;
