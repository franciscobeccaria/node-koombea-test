import rateLimit from 'express-rate-limit';

const isTestEnvironment = process.env.NODE_ENV === 'test';

/**
 * Rate limiter for authentication endpoints (register, login, refresh)
 * Prevents brute force attacks on auth endpoints
 * Limit: 5 requests per 15 minutes per IP
 * Disabled in test environments
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: {
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: () => isTestEnvironment,
});

/**
 * Rate limiter for pages endpoints
 * Limit: 20 requests per minute per IP
 * Disabled in test environments
 */
export const pagesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per windowMs
  message: {
    message: 'Too many requests to pages endpoint, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnvironment,
});

/**
 * General API rate limiter
 * Limit: 100 requests per minute per IP
 * Can be used as a global middleware
 * Disabled in test environments
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per windowMs
  message: {
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnvironment,
});
