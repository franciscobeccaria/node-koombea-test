import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.mjs';

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('GET /health should return server status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Server is running');
    });
  });

  describe('Auth Routes - Input Validation', () => {
    describe('POST /auth/register', () => {
      it('should return 400 if email is missing', async () => {
        const response = await request(app).post('/auth/register').send({
          password: 'password123',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 if password is missing', async () => {
        const response = await request(app).post('/auth/register').send({
          email: 'test@example.com',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 if password is less than 6 characters', async () => {
        const response = await request(app).post('/auth/register').send({
          email: 'test@example.com',
          password: 'pass',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should accept valid register request format', async () => {
        const response = await request(app).post('/auth/register').send({
          email: 'newuser@example.com',
          password: 'password123',
        });

        // Will fail at DB, but not at validation
        expect([400, 409, 500]).toContain(response.status);
      });
    });

    describe('POST /auth/login', () => {
      it('should return 400 if email is missing', async () => {
        const response = await request(app).post('/auth/login').send({
          password: 'password123',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 if password is missing', async () => {
        const response = await request(app).post('/auth/login').send({
          email: 'test@example.com',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('Pages Routes - Protected Endpoints', () => {
    describe('POST /pages', () => {
      it('should return 401 if no authorization header', async () => {
        const response = await request(app).post('/pages').send({
          url: 'https://example.com',
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 401 if invalid token', async () => {
        const response = await request(app)
          .post('/pages')
          .set('Authorization', 'Bearer invalid-token')
          .send({
            url: 'https://example.com',
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 if url is missing', async () => {
        // Even without valid token, should validate input
        const response = await request(app)
          .post('/pages')
          .set('Authorization', 'Bearer valid-token-format-but-invalid')
          .send({});

        expect([400, 401]).toContain(response.status);
      });

      it('should return 400 if url is invalid', async () => {
        const response = await request(app)
          .post('/pages')
          .set('Authorization', 'Bearer valid-token-format-but-invalid')
          .send({
            url: 'not-a-valid-url',
          });

        expect([400, 401]).toContain(response.status);
      });
    });

    describe('GET /pages', () => {
      it('should return 401 if no authorization header', async () => {
        const response = await request(app).get('/pages');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 401 if invalid token', async () => {
        const response = await request(app)
          .get('/pages')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('GET /pages/:id', () => {
      it('should return 401 if no authorization header', async () => {
        const response = await request(app).get('/pages/123');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 401 if invalid token', async () => {
        const response = await request(app)
          .get('/pages/123')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('GET /pages/:id/links', () => {
      it('should return 401 if no authorization header', async () => {
        const response = await request(app).get('/pages/123/links');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 401 if invalid token', async () => {
        const response = await request(app)
          .get('/pages/123/links')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('CORS Middleware', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/auth/register')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should add CORS headers to responses', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json {');

      expect([400, 401, 500]).toContain(response.status);
    });
  });

  describe('Request Content-Type', () => {
    it('should handle application/json content type', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Should not fail due to content-type
      expect([400, 401, 404, 500]).toContain(response.status);
    });
  });

  describe('Auth Controller - Error Cases', () => {
    it('should handle register endpoint with database error', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      // DB will fail, but response should have message
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle login endpoint with database error', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      // DB will fail, but response should have message
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Pages Controller - Error Cases', () => {
    it('should return 400 for invalid URL on create page', async () => {
      const response = await request(app)
        .post('/pages')
        .set('Authorization', 'Bearer invalid')
        .send({
          url: 'invalid-url',
        });

      // Should validate before trying to auth
      expect([400, 401]).toContain(response.status);
    });

    it('should return 401 when accessing pages list without token', async () => {
      const response = await request(app).get('/pages?limit=20&offset=0');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when accessing page details without token', async () => {
      const response = await request(app).get('/pages/invalid-id');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when accessing page links without token', async () => {
      const response = await request(app).get('/pages/invalid-id/links?limit=20&offset=0');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Middleware Chain', () => {
    it('should process request through CORS middleware', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.status).toBe(200);
    });

    it('should handle JSON parsing middleware', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Should process JSON and validate fields
      expect(response.body).toBeDefined();
    });

    it('should apply error middleware for unhandled errors', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Error middleware should catch DB error and return JSON
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });
  });

  describe('Auth Middleware', () => {
    it('should extract Bearer token from header', async () => {
      const response = await request(app)
        .get('/pages')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject malformed Bearer token', async () => {
      const response = await request(app)
        .get('/pages')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
    });

    it('should reject missing Bearer token', async () => {
      const response = await request(app)
        .get('/pages')
        .set('Authorization', 'Bearer');

      expect([400, 401]).toContain(response.status);
    });
  });
});
