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
    preferences = {},
    accountStatus // Allow account status to be set from frontend
  } = req.body;

  // Basic input validation
  if (!email || !name || !password || !phoneNumber) {
    throw new CustomError.BadRequestError(
      'Please provide email, name, password, and phone number'
    );
  }

  // =====================================================
  // PHONE NUMBER VALIDATION WITH DETAILED MESSAGES
  // =====================================================
  const validatePhoneNumber = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/[\s-()]/g, '');

    if (cleaned.startsWith('0')) {
      if (cleaned.length !== 10) {
        throw new CustomError.BadRequestError(
          `Local phone number must be exactly 10 digits starting with 0 (you provided ${cleaned.length} digits)`
        );
      }
      if (!/^\d+$/.test(cleaned)) {
        throw new CustomError.BadRequestError('Local phone number must contain only digits (0xxxxxxxxx)');
      }
    }
    else if (cleaned.startsWith('+')) {
      if (!cleaned.startsWith('+213')) {
        throw new CustomError.BadRequestError('International phone number must start with +213 (Algeria country code)');
      }
      if (cleaned.length !== 13) {
        throw new CustomError.BadRequestError(
          `International phone number must be +213 followed by exactly 9 digits (you provided ${cleaned.length - 4} digits after +213)`
        );
      }
    }
    else {
      throw new CustomError.BadRequestError(
        'Phone number must start with 0 for local format (0xxxxxxxxx) or +213 for international format (+213xxxxxxxxx)'
      );
    }

    return cleaned;
  };

  // =====================================================
  // AGE VALIDATION (15+ YEARS OLD)
  // =====================================================
  const validateAge = (dateOfBirth) => {
    if (!dateOfBirth) return; // Optional field

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      throw new CustomError.BadRequestError('Please provide a valid date of birth');
    }

    // Check if date is not in the future
    if (birthDate > today) {
      throw new CustomError.BadRequestError('Date of birth cannot be in the future');
    }

    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 15) {
      throw new CustomError.BadRequestError('You must be at least 15 years old to register');
    }

    return age;
  };

  // =====================================================
  // PASSWORD STRENGTH VALIDATION
  // =====================================================
  const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`at least ${minLength} characters`);
    }
    if (!hasUpperCase) {
      errors.push('at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('at least one special character (!@#$%^&*(),.?":{}|<>)');
    }

    if (errors.length > 0) {
      throw new CustomError.BadRequestError(
        `Password is too weak. Password must contain: ${errors.join(', ')}`
      );
    }
  };

  // =====================================================
  // PERFORM ALL VALIDATIONS
  // =====================================================

  // Validate and clean phone number
  const cleanedPhoneNumber = validatePhoneNumber(phoneNumber);

  // Validate age if date of birth is provided
  if (personalInfo.dateOfBirth) {
    validateAge(personalInfo.dateOfBirth);
  }

  // Validate password strength
  validatePasswordStrength(password);

  // =====================================================
  // UNIQUENESS CHECKS
  // =====================================================

  // Check if email already exists
  const emailAlreadyExists = await User.findOne({ email: email.toLowerCase().trim() });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError('Email already exists');
  }

  // Check if phone number already exists
  const phoneAlreadyExists = await User.findOne({ phoneNumber: cleanedPhoneNumber });
  if (phoneAlreadyExists) {
    throw new CustomError.BadRequestError('Phone number already exists');
  }

  // Check if national ID already exists (if provided)
  if (personalInfo.nationalId) {
    const nationalIdExists = await User.findOne({
      'personalInfo.nationalId': personalInfo.nationalId.trim()
    });
    if (nationalIdExists) {
      throw new CustomError.BadRequestError('National ID already registered');
    }
  }

  // =====================================================
  // BUSINESS LOGIC
  // =====================================================

  // Determine role - first account is admin, others default to user
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const userRole = isFirstAccount ? 'admin' : 'user';

  // Determine account status
  let finalAccountStatus;
  if (isFirstAccount) {
    // Admin is always active
    finalAccountStatus = 'active';
  } else if (accountStatus && ['active', 'pending_verification'].includes(accountStatus)) {
    // Allow frontend to set status if it's valid
    finalAccountStatus = accountStatus;
  } else {
    // Default to pending verification
    finalAccountStatus = 'pending_verification';
  }

  // Generate email verification token (only if account is not active)
  let verificationToken = null;
  let hashedVerificationToken = null;
  let verificationExpires = null;

  if (finalAccountStatus !== 'active') {
    verificationToken = crypto.randomBytes(40).toString('hex');
    hashedVerificationToken = crypto.createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  }

  // =====================================================
  // CREATE USER
  // =====================================================

  const userData = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phoneNumber: cleanedPhoneNumber,
    role: userRole,
    accountStatus: finalAccountStatus,
    personalInfo: {
      ...personalInfo,
      nationalId: personalInfo.nationalId?.trim(),
      dateOfBirth: personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth) : undefined
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
    createdBy: req.user?.userId || null
  };

  // Add email verification fields only if needed
  if (hashedVerificationToken) {
    userData.emailVerificationToken = hashedVerificationToken;
    userData.emailVerificationExpires = verificationExpires;
  } else {
    // Account is active, so email is verified
    userData.isEmailVerified = true;
  }

  const user = await User.create(userData);

  // =====================================================
  // SEND VERIFICATION EMAIL
  // =====================================================

  if (verificationToken && finalAccountStatus !== 'active') {
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
  }

  // =====================================================
  // PREPARE RESPONSE
  // =====================================================

  const userResponse = {
    userId: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    accountStatus: user.accountStatus,
    isEmailVerified: user.isEmailVerified,
    eligibility: user.eligibility,
    personalInfo: {
      dateOfBirth: user.personalInfo?.dateOfBirth,
      gender: user.personalInfo?.gender
    }
  };

  // Determine response message
  let message;
  if (isFirstAccount) {
    message = 'Admin account created successfully';
  } else if (finalAccountStatus === 'active') {
    message = 'Account created successfully and is now active';
  } else {
    message = 'Account created successfully. Please check your email for verification.';
  }

  res.status(StatusCodes.CREATED).json({
    message,
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
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid email or password. Please check your credentials.',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid email or password. Please check your credentials.',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check account status
  if (user.accountStatus === 'suspended') {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'Your account has been suspended. Please contact support.',
      code: 'ACCOUNT_SUSPENDED'
    });
  }

  if (user.accountStatus === 'inactive') {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'Your account is inactive. Please contact support.',
      code: 'ACCOUNT_INACTIVE'
    });
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
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    accountStatus: user.accountStatus,
    isEmailVerified: user.isEmailVerified,
    personalInfo: user.personalInfo,
    economicInfo: user.economicInfo,
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