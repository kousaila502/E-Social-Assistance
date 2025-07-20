const { StatusCodes } = require('http-status-codes');
const crypto = require('crypto');
const User = require('../models/user');
const CustomError = require('../errors');
const { attachCookiesToResponse, createTokenUser } = require('../utils/jwt');
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail
} = require('../utils/sendEmail');

/**
 * User Registration
 * Creates new user account with comprehensive validation and email verification
 */
const register = async (req, res) => {
  const { 
    email, 
    name, 
    password, 
    phoneNumber, 
    personalInfo = {},
    economicInfo = {},
    preferences = {}
  } = req.body;

  // Input validation
  if (!email || !name || !password || !phoneNumber) {
    throw new CustomError.BadRequestError(
      'Please provide email, name, password, and phone number'
    );
  }

  // Check if email already exists
  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError('Email already exists');
  }

  // Check if phone number already exists
  const phoneAlreadyExists = await User.findOne({ phoneNumber });
  if (phoneAlreadyExists) {
    throw new CustomError.BadRequestError('Phone number already exists');
  }

  // Check if national ID already exists (if provided)
  if (personalInfo.nationalId) {
    const nationalIdExists = await User.findOne({ 
      'personalInfo.nationalId': personalInfo.nationalId 
    });
    if (nationalIdExists) {
      throw new CustomError.BadRequestError('National ID already registered');
    }
  }

  // Determine role - first account is admin, others default to user
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? 'admin' : 'user';

  // Generate email verification token
  const verificationToken = crypto.randomBytes(40).toString('hex');

  // Create user with comprehensive data
  const userData = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phoneNumber: phoneNumber.trim(),
    role,
    personalInfo: {
      ...personalInfo,
      nationalId: personalInfo.nationalId?.trim()
    },
    economicInfo: {
      familySize: economicInfo.familySize || 1,
      dependents: economicInfo.dependents || 0,
      monthlyIncome: economicInfo.monthlyIncome || 0,
      employmentStatus: economicInfo.employmentStatus || 'unemployed',
      maritalStatus: economicInfo.maritalStatus || 'single'
    },
    preferences: {
      language: preferences.language || 'ar',
      notifications: {
        email: preferences.notifications?.email !== false,
        sms: preferences.notifications?.sms || false
      }
    },
    emailVerificationToken: crypto.createHash('sha256')
      .update(verificationToken)
      .digest('hex'),
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    createdBy: req.user?.userId || null
  };

  const user = await User.create(userData);

  // Send verification email (don't wait for it)
  if (!isFirstAccount) { // Admin doesn't need email verification
    try {
      const origin = process.env.ORIGIN || 'http://localhost:3000';
      await sendVerificationEmail({
        name: user.name,
        email: user.email,
        verificationToken,
        origin
      });
    } catch (error) {
      console.error('Email verification send failed:', error);
      // Don't throw error - user is created, just log the email issue
    }
  } else {
    // Auto-verify admin account
    user.isEmailVerified = true;
    user.accountStatus = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
  }

  // Remove sensitive data from response
  const userResponse = {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    isEmailVerified: user.isEmailVerified,
    eligibility: user.eligibility
  };

  res.status(StatusCodes.CREATED).json({
    message: isFirstAccount 
      ? 'Admin account created successfully'
      : 'Account created successfully. Please check your email for verification.',
    user: userResponse
  });
};

/**
 * Email Verification
 * Verifies user email address using token
 */
const verifyEmail = async (req, res) => {
  const { token, email } = req.body;

  if (!token || !email) {
    throw new CustomError.BadRequestError('Please provide verification token and email');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    email: email.toLowerCase(),
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid or expired verification token');
  }

  // Verify email and activate account
  user.isEmailVerified = true;
  user.accountStatus = 'active';
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  user.lastLoginAt = new Date();

  await user.save();

  res.status(StatusCodes.OK).json({
    message: 'Email verified successfully. You can now login.'
  });
};

/**
 * Resend Email Verification
 * Sends new verification email
 */
const resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError.BadRequestError('Please provide email address');
  }

  const user = await User.findOne({ 
    email: email.toLowerCase(),
    isEmailVerified: false
  });

  if (!user) {
    throw new CustomError.BadRequestError('Email not found or already verified');
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(40).toString('hex');
  
  user.emailVerificationToken = crypto.createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  await user.save();

  // Send verification email
  const origin = process.env.ORIGIN || 'http://localhost:3000';
  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    verificationToken,
    origin
  });

  res.status(StatusCodes.OK).json({
    message: 'Verification email sent successfully'
  });
};

/**
 * User Login
 * Authenticates user and returns JWT tokens
 */
const login = async (req, res) => {
  const { email, password, rememberMe = false } = req.body;

  // Input validation
  if (!email || !password) {
    throw new CustomError.BadRequestError('Please provide email and password');
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password');

  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid credentials');
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid credentials');
  }

  // Check account status
  if (user.accountStatus === 'suspended') {
    throw new CustomError.UnauthorizedError('Account suspended. Contact administrator.');
  }

  if (user.accountStatus === 'inactive') {
    throw new CustomError.UnauthorizedError('Account inactive. Contact administrator.');
  }

  // Check email verification (except for admin)
  if (!user.isEmailVerified && user.role !== 'admin') {
    throw new CustomError.UnauthenticatedError(
      'Please verify your email before logging in. Check your inbox for verification link.'
    );
  }

  // Update login tracking
  const loginIP = req.ip || req.connection.remoteAddress;
  user.lastLoginAt = new Date();
  user.lastLoginIP = loginIP;
  await user.save();

  // Create refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Create token user object
  const tokenUser = createTokenUser(user);

  // Set token expiration based on rememberMe
  const tokenExpiration = rememberMe ? '30d' : '1d';

  // Attach cookies
  attachCookiesToResponse({ 
    res, 
    user: tokenUser, 
    refreshToken,
    expiresIn: tokenExpiration
  });

  // Prepare response user object
  const userResponse = {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    preferences: user.preferences,
    eligibility: user.eligibility,
    lastLoginAt: user.lastLoginAt
  };

  res.status(StatusCodes.OK).json({
    message: 'Login successful',
    user: userResponse
  });
};

/**
 * User Logout
 * Clears authentication cookies
 */
const logout = async (req, res) => {
  // Clear cookies
  res.cookie('accessToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.cookie('refreshToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(StatusCodes.OK).json({ 
    message: 'Logged out successfully' 
  });
};

/**
 * Forgot Password
 * Sends password reset email
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError.BadRequestError('Please provide email address');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success message for security (don't reveal if email exists)
  if (user && user.accountStatus !== 'suspended') {
    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    try {
      const origin = process.env.ORIGIN || 'http://localhost:3000';
      await sendResetPasswordEmail({
        name: user.name,
        email: user.email,
        resetToken,
        origin
      });
    } catch (error) {
      // Reset the token fields if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      throw new CustomError.InternalServerError('Email could not be sent. Please try again.');
    }
  }

  res.status(StatusCodes.OK).json({
    message: 'If an account with that email exists, a password reset link has been sent.'
  });
};

/**
 * Reset Password
 * Resets user password using reset token
 */
const resetPassword = async (req, res) => {
  const { token, email, password, confirmPassword } = req.body;

  if (!token || !email || !password || !confirmPassword) {
    throw new CustomError.BadRequestError(
      'Please provide token, email, password, and confirmation'
    );
  }

  if (password !== confirmPassword) {
    throw new CustomError.BadRequestError('Passwords do not match');
  }

  // Hash the token to compare with stored version
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    email: email.toLowerCase(),
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid or expired reset token');
  }

  // Update password and clear reset fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  await user.save();

  res.status(StatusCodes.OK).json({
    message: 'Password reset successfully. You can now login with your new password.'
  });
};

/**
 * Change Password
 * Changes password for authenticated user
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new CustomError.BadRequestError(
      'Please provide current password, new password, and confirmation'
    );
  }

  if (newPassword !== confirmPassword) {
    throw new CustomError.BadRequestError('New passwords do not match');
  }

  if (currentPassword === newPassword) {
    throw new CustomError.BadRequestError('New password must be different from current password');
  }

  // Get user with password
  const user = await User.findById(req.user.userId).select('+password');

  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }

  // Verify current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(StatusCodes.OK).json({
    message: 'Password changed successfully'
  });
};

/**
 * Get Current User
 * Returns current authenticated user info
 */
const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.userId)
    .populate('createdBy', 'name email')
    .select('-password');

  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }

  res.status(StatusCodes.OK).json({
    user
  });
};

/**
 * Update Profile
 * Updates user profile information
 */
const updateProfile = async (req, res) => {
  const { 
    name, 
    phoneNumber, 
    personalInfo, 
    economicInfo, 
    preferences 
  } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }

  // Update allowed fields
  if (name) user.name = name.trim();
  if (phoneNumber) {
    // Check if phone number is already taken by another user
    const phoneExists = await User.findOne({ 
      phoneNumber: phoneNumber.trim(),
      _id: { $ne: user._id }
    });
    if (phoneExists) {
      throw new CustomError.BadRequestError('Phone number already in use');
    }
    user.phoneNumber = phoneNumber.trim();
  }

  // Update nested objects
  if (personalInfo) {
    user.personalInfo = { ...user.personalInfo, ...personalInfo };
  }
  if (economicInfo) {
    user.economicInfo = { ...user.economicInfo, ...economicInfo };
  }
  if (preferences) {
    user.preferences = { ...user.preferences, ...preferences };
  }

  user.updatedBy = req.user.userId;
  await user.save();

  const updatedUser = await User.findById(user._id).select('-password');

  res.status(StatusCodes.OK).json({
    message: 'Profile updated successfully',
    user: updatedUser
  });
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  updateProfile
};