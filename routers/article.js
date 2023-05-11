const express = require('express');
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  createArticle,
  getAllArticles,
  getSingleArticle,
  updateArticle
} = require('../controllers/article');


router
  .route('/emp')
  .get(authenticateUser, getAllArticles);

router
.route('/admin')
.post([authenticateUser, authorizePermissions('admin')],createArticle)
.get([authenticateUser, authorizePermissions('admin')],getAllArticles);

router
  .route('/emp/:id')
  .get(authenticateUser,getSingleArticle);

router
.route('/admin/:id')
.get([authenticateUser, authorizePermissions('admin')], getSingleArticle)
.patch([authenticateUser, authorizePermissions('admin')], updateArticle);


module.exports = router;
