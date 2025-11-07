import rateLimit from 'express-rate-limit';

const isTestEnvironment = process.env.NODE_ENV === 'test';

/**
 * Factory function to create rate limiters with consistent configuration
 * @param {number} max - Maximum number of requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @param {string} message - Error message
 * @returns {Function} Express middleware
 */
const createLimiter = (max, windowMs, message) => rateLimit({
  windowMs,
  max,
  message: { message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnvironment,
});

/**
 * Rate limiter for authentication endpoints (register, login, refresh)
 * Limit: 100 requests per minute per IP
 */
export const authLimiter = createLimiter(
  100,
  60 * 1000,
  'Too many authentication attempts, please try again later'
);

/**
 * Rate limiter for pages endpoints
 * Limit: 20 requests per minute per IP
 */
export const pagesLimiter = createLimiter(
  20,
  60 * 1000,
  'Too many requests to pages endpoint, please try again later'
);

/**
 * General API rate limiter
 * Limit: 100 requests per minute per IP
 */
export const generalLimiter = createLimiter(
  100,
  60 * 1000,
  'Too many requests, please try again later'
);
