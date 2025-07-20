const { StatusCodes } = require('http-status-codes');

const errorHandlerMiddleware = (err, req, res, next) => {
  // Default error object
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || 'Something went wrong, please try again later',
  };

  // Log errors in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
    });
  }

  // Handle Custom API Errors
  if (err.name === 'CustomAPIError') {
    customError.statusCode = err.statusCode;
    customError.message = err.message;
  }

  // Handle ValidationError (Mongoose)
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((item) => {
      if (item.kind === 'required') {
        return `${item.path} is required`;
      }
      if (item.kind === 'enum') {
        return `${item.path} must be one of: ${item.enumValues.join(', ')}`;
      }
      if (item.kind === 'minlength') {
        return `${item.path} must be at least ${item.properties.minlength} characters`;
      }
      if (item.kind === 'maxlength') {
        return `${item.path} must be no more than ${item.properties.maxlength} characters`;
      }
      return item.message;
    });
    customError.message = `Validation failed: ${errors.join(', ')}`;
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Handle CastError (Mongoose - Invalid ObjectId)
  if (err.name === 'CastError') {
    if (err.kind === 'ObjectId') {
      customError.message = `Invalid ${err.path}: ${err.value}`;
    } else {
      customError.message = `Invalid ${err.path} format`;
    }
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Handle MongoDB Duplicate Key Error
  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    // Handle common duplicate fields with user-friendly messages
    if (field === 'email') {
      customError.message = 'An account with this email already exists';
    } else if (field === 'username') {
      customError.message = 'This username is already taken';
    } else if (field === 'phone') {
      customError.message = 'An account with this phone number already exists';
    } else {
      customError.message = `${field} '${value}' already exists`;
    }
    customError.statusCode = StatusCodes.CONFLICT;
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    customError.message = 'Invalid token. Please log in again.';
    customError.statusCode = StatusCodes.UNAUTHORIZED;
  }

  if (err.name === 'TokenExpiredError') {
    customError.message = 'Token has expired. Please log in again.';
    customError.statusCode = StatusCodes.UNAUTHORIZED;
  }

  // Handle Multer Errors (File Upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    customError.message = 'File size too large. Maximum allowed size exceeded.';
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    customError.message = 'Too many files. Maximum file count exceeded.';
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    customError.message = 'Unexpected file field or file type not allowed.';
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Handle Mongoose Version Error
  if (err.name === 'VersionError') {
    customError.message =
      'Document has been modified by another process. Please refresh and try again.';
    customError.statusCode = StatusCodes.CONFLICT;
  }

  // Handle MongoDB Connection Errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    customError.message = 'Database connection error. Please try again later.';
    customError.statusCode = StatusCodes.SERVICE_UNAVAILABLE;
  }

  // Handle Rate Limiting Errors
  if (err.name === 'RateLimitError' || err.type === 'error.request.rate_limited') {
    customError.message = 'Too many requests. Please try again later.';
    customError.statusCode = StatusCodes.TOO_MANY_REQUESTS;
  }

  // Handle Payment/Financial Errors
  if (err.type === 'StripeCardError' || err.type === 'card_error') {
    customError.message = 'Payment processing error. Please check your payment information.';
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Handle File System Errors
  if (err.code === 'ENOENT') {
    customError.message = 'Requested file not found.';
    customError.statusCode = StatusCodes.NOT_FOUND;
  }

  if (err.code === 'EACCES') {
    customError.message = 'Access denied to requested resource.';
    customError.statusCode = StatusCodes.FORBIDDEN;
  }

  // Handle SyntaxError (JSON parsing errors)
  if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    customError.message = 'Invalid JSON format in request body.';
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Ensure we don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    // Log the actual error for debugging but don't send details to client
    if (customError.statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
      console.error('Internal Server Error:', err);
      customError.message = 'Internal server error. Please contact support if the problem persists.';
    }
  }

  // Send error response
  return res.status(customError.statusCode).json({
    message: customError.message,
    statusCode: customError.statusCode,
  });
};

module.exports = errorHandlerMiddleware;
