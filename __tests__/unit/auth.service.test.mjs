import { jest } from '@jest/globals';
import * as authService from '../../src/services/auth.service.mjs';

describe('Auth Service - Input Validation', () => {
  describe('registerUser', () => {
    it('should throw error if username is missing', async () => {
      await expect(authService.registerUser('', 'password123')).rejects.toThrow(
        'Username and password are required'
      );
    });

    it('should throw error if password is missing', async () => {
      await expect(authService.registerUser('testuser', '')).rejects.toThrow(
        'Username and password are required'
      );
    });

    it('should throw error if password is less than 6 characters', async () => {
      await expect(authService.registerUser('testuser', 'pass')).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    it('should not throw if valid username and password provided', async () => {
      try {
        // This will likely fail due to database, but not due to validation
        await authService.registerUser('testuser', 'password123');
      } catch (err) {
        // Expected to fail at database level, not validation
        expect(err.message).not.toContain('Username and password are required');
        expect(err.message).not.toContain('Password must be at least 6 characters');
      }
    });
  });

  describe('loginUser', () => {
    it('should throw error if username is missing', async () => {
      await expect(authService.loginUser('', 'password123')).rejects.toThrow(
        'Username and password are required'
      );
    });

    it('should throw error if password is missing', async () => {
      await expect(authService.loginUser('testuser', '')).rejects.toThrow(
        'Username and password are required'
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should throw error if token is invalid', () => {
      expect(() => authService.verifyAccessToken('invalid-token')).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      expect(() => authService.verifyAccessToken('not.a.token')).toThrow('Invalid or expired token');
    });
  });

  describe('refreshAccessToken', () => {
    it('should throw error if refresh token is missing', () => {
      expect(() => authService.refreshAccessToken('')).toThrow('Refresh token is required');
    });

    it('should throw error if refresh token is null', () => {
      expect(() => authService.refreshAccessToken(null)).toThrow('Refresh token is required');
    });

    it('should throw error if refresh token is invalid', () => {
      expect(() => authService.refreshAccessToken('invalid-token')).toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw error for malformed refresh token', () => {
      expect(() => authService.refreshAccessToken('not.a.token')).toThrow(
        'Invalid or expired refresh token'
      );
    });
  });
});
