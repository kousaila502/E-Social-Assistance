const CustomError = require('../errors');
const { isTokenValid, attachCookiesToResponse } = require('../utils/jwt');
const User = require('../models/user');

const authenticateUser = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    // Check for access token first
    if (accessToken) {
      try {
        const payload = isTokenValid(accessToken);
        
        // Verify user still exists and is active
        const user = await User.findById(payload.user.userId).select('+accountStatus');
        if (!user) {
          throw new CustomError.UnauthenticatedError('User account not found');
        }
        
        if ( user.accountStatus === 'suspended' || user.accountStatus === 'deactivated') {
          throw new CustomError.UnauthenticatedError('Account is inactive or suspended');
        }

        req.user = {
          userId: payload.user.userId,
          firstName: payload.user.firstName,
          lastName: payload.user.lastName,
          email: payload.user.email,
          role: payload.user.role
        };
        
        return next();
      } catch (error) {
        // Access token invalid, try refresh token
        if (!refreshToken) {
          throw new CustomError.UnauthenticatedError('Authentication required - no valid tokens');
        }
      }
    }

    // Try refresh token if access token failed or doesn't exist
    if (!refreshToken) {
      throw new CustomError.UnauthenticatedError('Authentication required - no tokens provided');
    }

    const refreshPayload = isTokenValid(refreshToken);
    
    // Verify user still exists and is active
    const user = await User.findById(refreshPayload.user.userId).select('+accountStatus');
    if (!user) {
      throw new CustomError.UnauthenticatedError('User account not found');
    }
    
    if (!user.isActive || user.accountStatus === 'suspended' || user.accountStatus === 'deactivated') {
      throw new CustomError.UnauthenticatedError('Account is inactive or suspended');
    }

    // Update last activity
    await User.findByIdAndUpdate(refreshPayload.user.userId, {
      lastActivity: new Date(),
      lastLoginIP: req.ip
    });

    // Generate new tokens
    attachCookiesToResponse({
      res,
      user: refreshPayload.user,
      refreshToken: refreshPayload.refreshToken,
    });

    req.user = {
      userId: refreshPayload.user.userId,
      firstName: refreshPayload.user.firstName,
      lastName: refreshPayload.user.lastName,
      email: refreshPayload.user.email,
      role: refreshPayload.user.role
    };
    
    next();
  } catch (error) {
    if (error instanceof CustomError.UnauthenticatedError) {
      throw error;
    }
    throw new CustomError.UnauthenticatedError('Authentication failed - invalid or expired tokens');
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    // Check if user exists in request (should be set by authenticateUser)
    if (!req.user) {
      throw new CustomError.UnauthenticatedError('Authentication required');
    }

    // Check if user has required role
    if (!req.user.role) {
      throw new CustomError.UnauthorizedError('User role not found');
    }

    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      );
    }
    
    next();
  };
};

// Middleware to check if user owns resource or has admin privileges
const authorizeResourceAccess = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      throw new CustomError.UnauthenticatedError('Authentication required');
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req[resourceUserField] || req.params.userId || req.body.userId;
    if (resourceUserId && resourceUserId.toString() === req.user.userId) {
      return next();
    }

    throw new CustomError.UnauthorizedError('Not authorized to access this resource');
  };
};

// Middleware to verify account status for sensitive operations
const requireActiveAccount = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError.UnauthenticatedError('Authentication required');
    }

    const user = await User.findById(req.user.userId).select('+accountStatus +isEmailVerified');
    if (!user) {
      throw new CustomError.UnauthenticatedError('User account not found');
    }

    if (user.accountStatus !== 'active') {
      throw new CustomError.UnauthorizedError(`Account status is ${user.accountStatus}. Active account required.`);
    }

    if (!user.isEmailVerified) {
      throw new CustomError.UnauthorizedError('Email verification required for this action');
    }

    next();
  } catch (error) {
    if (error instanceof CustomError.UnauthenticatedError || error instanceof CustomError.UnauthorizedError) {
      throw error;
    }
    throw new CustomError.BadRequestError('Unable to verify account status');
  }
};

module.exports = {
  authenticateUser,
  authorizePermissions,
  authorizeResourceAccess,
  requireActiveAccount,
};
