require("dotenv").config();
require("express-async-errors");

//express
const express = require("express");
const app = express();

// Swagger
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");

//Other packages
const cookieParser = require("cookie-parser");

//database
const connectDb = require("./db/connect");

// Security Middleware
const {
  setupHelmet,
  setupCORS,
  rateLimiter,
  authRateLimiter,
  apiRateLimiter,
  mongoSanitize,
  requestLogger,
  securityHeaders,
  requestTiming
} = require('./middleware/security');

// Authentication Middleware
const {
  authenticateUser,
  authorizePermissions,
} = require("./middleware/authentication");

//Routers
const authRoutes = require("./routers/authRoutes");
const userRouter = require("./routers/userRoutes");
const demandeRouter = require("./routers/demandeRoutes");
const contentRouter = require("./routers/contentRoutes");
const announcementRouter = require("./routers/announcementRoutes");
const budgetPoolRouter = require("./routers/budgetPoolRoutes");
const paymentRouter = require("./routers/paymentRoutes");
const notificationRouter = require("./routers/notificationRoutes");

//Middleware
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// Security middleware stack (applied first)
app.use(requestTiming);
app.use(setupHelmet());
app.use(setupCORS());
app.use(securityHeaders);
app.use(requestLogger());
app.use(mongoSanitize());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.JWT_SECRET));

// Rate limiting
app.use(rateLimiter);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Social Assistance Management System API",
    version: "1.0.0",
    documentation: "/api-docs",
    status: "active"
  });
});

// API Documentation
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth routes (with stricter rate limiting)
app.use("/api/v1/auth", authRateLimiter, authRoutes);

// Protected API routes (with API rate limiting)
app.use("/api/v1/users", apiRateLimiter, userRouter);
app.use("/api/v1/demandes", apiRateLimiter, demandeRouter);
app.use("/api/v1/content", apiRateLimiter, contentRouter);
app.use("/api/v1/announcements", apiRateLimiter, announcementRouter);
app.use("/api/v1/budget-pools", apiRateLimiter, budgetPoolRouter);
app.use("/api/v1/payments", apiRateLimiter, paymentRouter);
app.use("/api/v1/notifications", apiRateLimiter, notificationRouter);

// Legacy routes for backward compatibility
app.use("/api/v1/demande", apiRateLimiter, demandeRouter);
app.use("/api/v1/budget", apiRateLimiter, budgetPoolRouter);
app.use("/api/v1/paiment", apiRateLimiter, paymentRouter);
app.use("/api/v1/notification", apiRateLimiter, notificationRouter);

// Error handling middleware (applied last)
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDb(process.env.MONGO_URI || process.env.url);
    app.listen(port, () => {
      console.log(`🚀 Server is listening on port ${port}...`);
      console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${port}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

start();
