import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ENV from '../utils/env.mjs';
import * as authRepository from '../repositories/auth.repository.mjs';

export const registerUser = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.status = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error('Password must be at least 6 characters');
    error.status = 400;
    throw error;
  }

  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    const error = new Error('User already exists');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await authRepository.createUser(email, hashedPassword);

  return {
    user,
    accessToken: generateAccessToken(user.id),
    refreshToken: generateRefreshToken(user.id),
  };
};

export const loginUser = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.status = 400;
    throw error;
  }

  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  delete user.password;

  return {
    user,
    accessToken: generateAccessToken(user.id),
    refreshToken: generateRefreshToken(user.id),
  };
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ENV.JWT_SECRET);
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.status = 401;
    throw error;
  }
};

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, ENV.JWT_SECRET, { expiresIn: '1h' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};
