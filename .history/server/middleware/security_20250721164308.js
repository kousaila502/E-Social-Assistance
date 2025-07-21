const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

// Helper function to get client IP
const getClientIP = (req) => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         '127.0.0.1';
};

// Setup Helmet for security headers
const setupHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: false, // Disable if causing issues with file uploads
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  });
};

// Setup CORS
const setupCORS = () => {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        'https://your-production-domain.com',
        'https://admin.your-domain.com'
      ]
    : [
        'http://http://localhost:5173',
        'http://localhost:3001',
        'http://127.0.0.1:3000'
      ];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'), false);
      }
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200
  });
};

// General rate limiter
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 200, // Stricter in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    return `ip:${getClientIP(req)}`;
  },
  skip: (req) => {
    // Skip rate limiting for certain routes in development
    if (process.env.NODE_ENV === 'development') {
      return req.path === '/api/v1/health' || req.path === '/api/v1/status';
    }
    return false;
  }
});

// Stricter rate limiter for authentication routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Combine IP and email for more specific limiting
    const email = req.body?.email || 'unknown';
    const ip = getClientIP(req);
    return `auth:${ip}:${email}`;
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false // Count failed requests
});

// API rate limiter for authenticated users
const apiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // Different limits based on user role
    if (req.user?.role === 'admin') return 5000;
    if (req.user?.role === 'case_worker') return 2000;
    if (req.user?.role === 'finance_manager') return 1500;
    return 1000; // Regular users
  },
  message: {
    error: 'API rate limit exceeded. Please reduce request frequency.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user?.userId) {
      return `api:user:${req.user.userId}`;
    }
    return `api:${getClientIP(req)}`;
  },
  skip: (req) => {
    // Skip for health checks and static files
    return req.path.startsWith('/health') || 
           req.path.startsWith('/static') ||
           req.method === 'OPTIONS';
  }
});

// File upload rate limiter
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 file uploads per hour
  message: {
    error: 'File upload limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user?.userId) {
      return `upload:user:${req.user.userId}`;
    }
    return `upload:${getClientIP(req)}`;
  }
});

// MongoDB sanitization - use the imported package directly
const mongoSanitizeMiddleware = () => {
  return mongoSanitize({
    replaceWith: '_', // Replace prohibited characters with underscore
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized key ${key} in request to ${req.path}`);
    }
  });
};

// Request logger for development
const requestLogger = () => {
  if (process.env.NODE_ENV === 'development') {
    return morgan('combined', {
      skip: (req, res) => {
        // Skip logging for health checks and static files
        return req.path === '/health' || 
               req.path.startsWith('/static') ||
               req.path.startsWith('/favicon');
      }
    });
  }
  
  // Production logging (only errors and important requests)
  return morgan('combined', {
    skip: (req, res) => {
      return res.statusCode < 400; // Only log errors
    },
    stream: {
      write: (message) => {
        console.log(message.trim());
      }
    }
  });
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Additional custom security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Response-Time', Date.now() - req.startTime);
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Set custom headers based on environment
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }
  
  next();
};

// IP whitelist middleware for admin routes
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
      return next(); // Skip in development
    }
    
    const clientIP = getClientIP(req);
    
    // Add default allowed IPs
    const defaultAllowed = ['127.0.0.1', '::1', 'localhost'];
    const allAllowed = [...defaultAllowed, ...allowedIPs];
    
    if (allAllowed.includes(clientIP)) {
      next();
    } else {
      console.warn(`Unauthorized IP access attempt: ${clientIP} to ${req.path}`);
      res.status(403).json({
        message: 'Access denied from this IP address',
        statusCode: 403
      });
    }
  };
};

// Request timing middleware
const requestTiming = (req, res, next) => {
  req.startTime = Date.now();
  
  // Log slow requests
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (duration > 5000) { // Log requests taking more than 5 seconds
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
};

module.exports = {
  setupHelmet,
  setupCORS,
  rateLimiter,
  authRateLimiter,
  mongoSanitize: mongoSanitizeMiddleware,
  requestLogger
};