const express = require('express');
const router = express.Router();

const {
    authenticateUser,
    authorizePermissions,
  } = require('../middleware/authentication');

const {
    register,
    verifyEmail,
    resendVerification,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    getMe,
    updateProfile
} = require('../controllers/auth');

// Public routes (no authentication required)
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (authentication required)
router.post('/change-password', authenticateUser, changePassword);
router.get('/me', authenticateUser, getMe);
router.patch('/profile', authenticateUser, updateProfile);

module.exports = router;

