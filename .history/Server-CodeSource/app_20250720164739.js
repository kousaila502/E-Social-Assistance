require("dotenv").config();
require("express-async-errors");

//express
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

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

// Swagger
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");

// Core middleware
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

// Security middleware
app.use(setupHelmet());
app.use(setupCORS());
app.use(mongoSanitize());
app.use(requestLogger());

// Rate limiting
app.use(rateLimiter);

// Home route
app.get("/", (req, res) => {
  res.send('<h1>Project API</h1><a href="/api-docs">Documentation</a>');
});
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Routes mounting
app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/demandes", demandeRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/budget-pools", budgetPoolRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/announcements", announcementRoutes);

// Error handling middleware (LAST)
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDb(process.env.MONGO_URL);
    app.listen(port, () => {
      console.log(`the server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
