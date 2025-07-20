require("dotenv").config();
require("express-async-errors");
const {
  authenticateUser,
  authorizePermissions,
} = require("./middleware/authentication");

//express
const express = require("express");
const app = express();

// Swagger
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");

//Other packages
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

//database
const connectDb = require("./db/connect");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Routers
const authRoutes = require("./routers/auth");
const userRouter = require("./routers/user");
const demandeRouter = require("./routers/demande");
const annonceRouter = require("./routers/annonce");
const articleRouter = require("./routers/article");
const sousChapitreRouter = require("./routers/sous_chapitre");
const chapitreRouter = require("./routers/chapitre");
const budgetRouter = require("./routers/budgetPool");
const paimentRouter = require("./routers/paiment");
const notificationRouter = require("./routers/notification");

//Middleware
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.get("/", (req, res) => {
  res.send('<h1>Project API</h1><a href="/api-docs">Documentation</a>');
});
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use("/api/v1/auth/", authRoutes);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/demande", demandeRouter);
app.use("/api/v1/annonce", annonceRouter);
app.use("/api/v1/article", articleRouter);
app.use("/api/v1/sousChapitre", sousChapitreRouter);
app.use("/api/v1/chapitre", chapitreRouter);
app.use("/api/v1/notification", notificationRouter);
app.use(
  "/api/v1/budget",
  [authenticateUser, authorizePermissions("admin")],
  budgetRouter
);
app.use(
  "/api/v1/paiment",
  [authenticateUser, authorizePermissions("admin")],
  paimentRouter
);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

//const mongoSanitize = require('express-mongo-sanitize');

const port = 5000;

const start = async () => {
  try {
    await connectDb(process.env.url);
    app.listen(port, () => {
      console.log(`the server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
