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

// Content routes
router.use(authenticateUser);

router.route('/')
  .get(getAllContent)
  .post(authorizePermissions('admin', 'case_worker'), createContent);

router.route('/analytics')
  .get(authorizePermissions('admin', 'case_worker'), getContentAnalytics);

router.route('/:id')
  .get(getSingleContent)
  .patch(authorizePermissions('admin', 'case_worker'), updateContent)
  .delete(authorizePermissions('admin', 'case_worker'), deleteContent);

router.route('/:id/publish')
  .patch(authorizePermissions('admin', 'case_worker'), publishContent);

router.route('/:id/hierarchy')
  .patch(authorizePermissions('admin', 'case_worker'), updateContentHierarchy);

module.exports = router;
