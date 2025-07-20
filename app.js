require("dotenv").config();
require("express-async-errors");

// Environment validation
const validateEnvironment = () => {
  const requiredVars = ['MONGO_URL', 'JWT_SECRET', 'NODE_ENV'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    missingVars.push('JWT_SECRET (must be at least 32 characters)');
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease add these to your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated successfully');
};

// Validate environment before starting
validateEnvironment();

//express
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");

//database
const connectDb = require("./db/connect");

// Middleware imports
const {
  setupHelmet,
  setupCORS,
  rateLimiter,
  authRateLimiter,
  mongoSanitize,
  requestLogger,
} = require("./middleware/security");
const { authenticateUser, authorizePermissions } = require("./middleware/authentication");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

//Route imports
const authRoutes = require("./routers/authRoutes");
const userRoutes = require("./routers/userRoutes");
const demandeRoutes = require("./routers/demandeRoutes");
const paymentRoutes = require("./routers/paymentRoutes");
const budgetPoolRoutes = require("./routers/budgetPoolRoutes");
const notificationRoutes = require("./routers/notificationRoutes");
const contentRoutes = require("./routers/contentRoutes");
const announcementRoutes = require("./routers/announcementRoutes");
const healthRoutes = require('./routers/healthRoutes');

// Swagger
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Core middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.JWT_SECRET));

// Security middleware
app.use(setupHelmet());
app.use(setupCORS());
app.use(mongoSanitize());
app.use(requestLogger());

// Rate limiting
app.use(rateLimiter);

// Health check (before authentication)
app.use('/api/v1', healthRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Social Assistance Management API",
    version: "1.0.0",
    status: "operational",
    documentation: "/api-docs",
    health: "/api/v1/health",
    timestamp: new Date().toISOString()
  });
});

// API Documentation
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument, {
  customSiteTitle: "Social Assistance API Docs",
  customCss: '.swagger-ui .topbar { background-color: #2c3e50; }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true
  }
}));

// Routes mounting with proper rate limiting
app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/demandes", demandeRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/budget-pools", budgetPoolRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/announcements", announcementRoutes);

// API version info
app.get("/api/v1", (req, res) => {
  res.json({
    message: "Social Assistance Management API v1",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      demandes: "/api/v1/demandes",
      payments: "/api/v1/payments",
      budgetPools: "/api/v1/budget-pools",
      notifications: "/api/v1/notifications",
      content: "/api/v1/content",
      announcements: "/api/v1/announcements",
      health: "/api/v1/health"
    },
    documentation: "/api-docs"
  });
});

// Catch all API routes that don't exist
app.all('/api/*', (req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
    availableEndpoints: "/api/v1",
    documentation: "/api-docs"
  });
});

// Error handling middleware (LAST)
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 8080;

const start = async () => {
  try {
    console.log('🔄 Starting Social Assistance Management API...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Connecting to database...`);
    
    await connectDb(process.env.MONGO_URL);
    console.log('✅ Database connected successfully');
    
    app.listen(port, () => {
      console.log(`🚀 Server is listening on port ${port}`);
      console.log(`📋 API Documentation: http://localhost:${port}/api-docs`);
      console.log(`❤️  Health Check: http://localhost:${port}/api/v1/health`);
      console.log(`🌐 API Base URL: http://localhost:${port}/api/v1`);
      console.log('🎉 Social Assistance Management API is ready!');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

start();