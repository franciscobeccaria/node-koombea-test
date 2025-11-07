/**
 * Global error handler middleware
 * Catches all errors and returns JSON response with consistent format
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message || 'Validation error';
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized';
  }

  if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = err.message || 'Not found';
  }

  res.status(statusCode).json({
    message,
  });
};

export default errorHandler;
