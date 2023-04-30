require("dotenv").config();
require('express-async-errors');

//express
const express = require('express');
const app = express();

// Swagger
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

//Other packages
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');

//database
const connectDb = require('./db/connect');

//Routers
const authRoutes = require('./routers/auth');
const userRouter = require('./routers/user');
const demandeRouter = require('./routers/demande');

//Middleware
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
res.send('<h1>Project API</h1><a href="/api-docs">Documentation</a>');
});
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use('/api/v1/auth/',authRoutes);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/demande', demandeRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);


//const mongoSanitize = require('express-mongo-sanitize');

const port = 3000 ;

const start = async()=>{
    try {
        await connectDb(process.env.url);
        app.listen(port,()=>{
            console.log(`the server is listening on port ${port}...`);
        })
    } catch (error) {
        console.log(error);
    }
}

start();