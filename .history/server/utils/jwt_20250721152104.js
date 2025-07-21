const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Create access token with user payload
const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME || '1d',
    issuer: 'social-assistance-api',
    audience: 'social-assistance-client'
  });
  return token;
};

// Generate secure random refresh token
const createRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Verify and decode JWT token with error handling
const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Return null for invalid tokens, let middleware handle errors
    return null;
  }
};

// Legacy function for backward compatibility
const isTokenValid = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error; // Keep original behavior for existing code
  }
};

// Format user object for token payload
const createTokenUser = (user) => {
  return {
    userId: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role
  };
};

// Set cookies with access and refresh tokens
const attachCookiesToResponse = ({ res, user, refreshToken, rememberMe = false }) => {
  const tokenUser = user;
  
  // Create access token
  const accessTokenJWT = createJWT({ payload: { user: tokenUser } });
  
  // Create refresh token JWT
  const refreshTokenJWT = createJWT({ 
    payload: { 
      user: tokenUser, 
      refreshToken: refreshToken || createRefreshToken()
    } 
  });

  // Token expiration times
  const accessTokenExpiry = rememberMe 
    ? 1000 * 60 * 60 * 24 * 7  // 7 days if remember me
    : 1000 * 60 * 60 * 24;      // 1 day default
  
  const refreshTokenExpiry = 1000 * 60 * 60 * 24 * 30; // 30 days

  // Cookie configuration
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: 'strict',
    path: '/'
  };

  // Set access token cookie
  res.cookie('accessToken', accessTokenJWT, {
    ...cookieOptions,
    expires: new Date(Date.now() + accessTokenExpiry),
    maxAge: accessTokenExpiry
  });

  // Set refresh token cookie
  res.cookie('refreshToken', refreshTokenJWT, {
    ...cookieOptions,
    expires: new Date(Date.now() + refreshTokenExpiry),
    maxAge: refreshTokenExpiry
  });

  return {
    accessToken: accessTokenJWT,
    refreshToken: refreshTokenJWT,
    user: tokenUser
  };
};

// Clear authentication cookies
const clearTokenCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: 'strict',
    path: '/'
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

// Validate token structure and claims
const validateTokenStructure = (decoded) => {
  if (!decoded || typeof decoded !== 'object') {
    return false;
  }

  // Check required user fields
  if (!decoded.user || 
      !decoded.user.userId || 
      !decoded.user.email || 
      !decoded.user.role) {
    return false;
  }

  // Check token expiration
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    return false;
  }

  return true;
};

// Generate password reset token
const createPasswordResetToken = (userId) => {
  const payload = {
    userId,
    type: 'password_reset',
    timestamp: Date.now()
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h', // Password reset tokens expire in 1 hour
    issuer: 'social-assistance-api',
    audience: 'password-reset'
  });
};

// Generate email verification token
const createEmailVerificationToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'email_verification',
    timestamp: Date.now()
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h', // Email verification tokens expire in 24 hours
    issuer: 'social-assistance-api',
    audience: 'email-verification'
  });
};

module.exports = {
  createJWT,
  createRefreshToken,
  verifyJWT,
  isTokenValid, // Keep for backward compatibility
  createTokenUser,
  attachCookiesToResponse,
  clearTokenCookies,
  validateTokenStructure,
  createPasswordResetToken,
  createEmailVerificationToken
};
