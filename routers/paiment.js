const express = require('express');
const router = express.Router();


const {
  getTrans,
  updateTrans,
  createDemandeTrans,
  createEnterPoolTrans,
  getSingleTrans
} = require('../controllers/paiment');


router.route('/getTrans').get(getTrans);
router.route('/getSingleTrans/:id').get(getSingleTrans);
router.route('/createDemandeTrans/:id').post(createDemandeTrans);
router.route('/createEnterPoolTrans').post(createEnterPoolTrans);
router.route('/updateTrans/:id').patch(updateTrans);



module.exports = router;
