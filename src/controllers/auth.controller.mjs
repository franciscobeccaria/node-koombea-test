import * as authService from '../services/auth.service.mjs';

/**
 * POST /auth/register
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const result = await authService.registerUser(username, password);

    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const result = await authService.loginUser(username, password);

    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};
