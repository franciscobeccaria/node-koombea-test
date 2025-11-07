import * as authService from '../services/auth.service.mjs';

/**
 * Auth guard middleware
 * Validates JWT token from httpOnly cookie or Authorization header
 * Returns 401 if token is missing or invalid
 */
export const authGuard = (req, res, next) => {
  try {
    const token = req.cookies.accessToken ||
                  (req.headers.authorization?.startsWith('Bearer ')
                    ? req.headers.authorization.slice(7)
                    : null);

    if (!token) {
      const error = new Error('Unauthorized');
      error.status = 401;
      throw error;
    }

    const decoded = authService.verifyAccessToken(token);
    req.user = { userId: decoded.userId };

    next();
  } catch (error) {
    if (error.status) {
      return next(error);
    }

    const err = new Error('Unauthorized');
    err.status = 401;
    next(err);
  }
};

export default authGuard;
