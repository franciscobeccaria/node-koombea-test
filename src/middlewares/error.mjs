/**
 * Global error handler middleware
 * Catches all errors and returns JSON response with consistent format
 */
const errorHandler = (err, req, res, next) => {
  // Log error to console for debugging
  console.error('Error:', err);

  // Default error values
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Specific error handling
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

  // Send error response
  res.status(statusCode).json({
    message,
  });
};

export default errorHandler;
