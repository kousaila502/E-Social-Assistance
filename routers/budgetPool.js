const express = require('express');
const router = express.Router();


const {
  getBudget,
  pushBudget,
  popBudget,
  createBudget,
  getSingleBudget,
  updateBudget
} = require('../controllers/budgetPool');


router.route('/getBudget').get(getBudget)
router.route('/getSingleBudget/:id').get(getSingleBudget)
router.route('/createBudget').post(createBudget)
router.route('/pushBudget/:id').patch(pushBudget)
router.route('/popBudget/:id').patch(popBudget);
router.route('/updateBudget/:id').patch(updateBudget);




module.exports = router;
