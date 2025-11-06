import * as authService from '../services/auth.service.mjs';

/**
 * Auth guard middleware
 * Validates JWT token and sets req.user
 * Returns 401 if token is missing or invalid
 */
export const authGuard = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Unauthorized');
      error.status = 401;
      throw error;
    }

    // Extract token
    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = authService.verifyAccessToken(token);

    // Attach user info to request
    req.user = { userId: decoded.userId };

    next();
  } catch (error) {
    // If error is already thrown by verifyAccessToken, just pass it
    if (error.status) {
      return next(error);
    }

    // Otherwise, create unauthorized error
    const err = new Error('Unauthorized');
    err.status = 401;
    next(err);
  }
};

export default authGuard;
