const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  const response = {
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  // Log everything to the server console in all environments
  console.error(`[Error] ${req.method} ${req.url}: ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.json(response);
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
