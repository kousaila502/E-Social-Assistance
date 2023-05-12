const express = require('express');
const router = express.Router();


const {
  getBudget,
  pushBudget,
  popBudget,
  createBudget,
  getSingleBudget
} = require('../controllers/budgetPool');


router.route('/getBudget').get(getBudget)
router.route('/getSingleBudget/:id').get(getSingleBudget)
router.route('/createBudget').post(createBudget)
router.route('/pushBudget/:id').patch(pushBudget)
router.route('/popBudget/:id').patch(popBudget);



module.exports = router;
