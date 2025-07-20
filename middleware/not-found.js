const { StatusCodes } = require('http-status-codes');

const notFound = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
    statusCode: StatusCodes.NOT_FOUND
  });
};

module.exports = notFound;
