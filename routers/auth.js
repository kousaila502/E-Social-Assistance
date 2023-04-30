const express = require('express');
const router = express.Router();

const {
    login,
    register,
    logout,
    forgotPassword} = require('../controllers/auth')

router.post('/login',login);
router.post('/register',register);
router.delete('/logout',logout);
router.post('/forgot-password', forgotPassword);

module.exports = router;

