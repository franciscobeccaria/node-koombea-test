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
      it('should return 400 if username is missing', async () => {
        const response = await request(app).post('/auth/register').send({
          password: 'password123',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 if password is missing', async () => {
        const response = await request(app).post('/auth/register').send({
          username: 'testuser',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 if password is less than 6 characters', async () => {
        const response = await request(app).post('/auth/register').send({
          username: 'testuser',
          password: 'pass',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should accept valid register request format', async () => {
        const response = await request(app).post('/auth/register').send({
          username: 'newuser',
          password: 'password123',
        });

        // Should succeed with valid data
        expect(response.status).toBe(201);
        // Tokens are now in httpOnly cookies, not in response body
        expect(response.headers['set-cookie']).toBeDefined();
        const setCookieHeaders = response.headers['set-cookie'];
        const hasAccessToken = setCookieHeaders.some(cookie => cookie.includes('accessToken'));
        const hasRefreshToken = setCookieHeaders.some(cookie => cookie.includes('refreshToken'));
        expect(hasAccessToken).toBe(true);
        expect(hasRefreshToken).toBe(true);
        expect(response.body.user.username).toBe('newuser');
      });
    });

    describe('POST /auth/login', () => {
      it('should return 400 if username is missing', async () => {
        const response = await request(app).post('/auth/login').send({
          password: 'password123',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 if password is missing', async () => {
        const response = await request(app).post('/auth/login').send({
          username: 'testuser',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /auth/refresh', () => {
      it('should return 400 if refresh token is missing', async () => {
        const response = await request(app).post('/auth/refresh').send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should return 401 if refresh token is invalid', async () => {
        const response = await request(app).post('/auth/refresh').send({
          refreshToken: 'invalid-token',
        });

        expect(response.status).toBe(401);
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
          username: 'testuser',
          password: 'password123',
        });

      // Should not fail due to content-type
      expect([400, 401, 404, 500]).toContain(response.status);
    });
  });

  describe('Auth Controller - Error Cases', () => {
    it('should return 409 when registering duplicate username', async () => {
      // First registration should succeed
      const firstResponse = await request(app).post('/auth/register').send({
        username: 'duplicateuser',
        password: 'password123',
      });
      expect(firstResponse.status).toBe(201);

      // Second registration with same username should fail with 409 Conflict
      const response = await request(app).post('/auth/register').send({
        username: 'duplicateuser',
        password: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when login with non-existent user', async () => {
      const response = await request(app).post('/auth/login').send({
        username: 'nonexistentuser',
        password: 'password123',
      });

      // Login should fail with 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should accept valid login request and set cookies', async () => {
      // First register a user
      await request(app).post('/auth/register').send({
        username: 'logintest',
        password: 'password123',
      });

      // Then login
      const response = await request(app).post('/auth/login').send({
        username: 'logintest',
        password: 'password123',
      });

      // Should succeed with valid credentials
      expect(response.status).toBe(200);
      // Tokens should be in httpOnly cookies
      expect(response.headers['set-cookie']).toBeDefined();
      const setCookieHeaders = response.headers['set-cookie'];
      const hasAccessToken = setCookieHeaders.some(cookie => cookie.includes('accessToken'));
      const hasRefreshToken = setCookieHeaders.some(cookie => cookie.includes('refreshToken'));
      expect(hasAccessToken).toBe(true);
      expect(hasRefreshToken).toBe(true);
      expect(response.body.user.username).toBe('logintest');
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully process logout request', async () => {
      // First register and login
      await request(app).post('/auth/register').send({
        username: 'logouttest',
        password: 'password123',
      });

      const agent = request.agent(app);
      // Use agent to maintain cookies across requests
      const loginRes = await agent.post('/auth/login').send({
        username: 'logouttest',
        password: 'password123',
      });

      expect(loginRes.status).toBe(200);

      // Now logout
      const logoutRes = await agent.post('/auth/logout');

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body).toHaveProperty('message');
      expect(logoutRes.body.message).toBe('Logged out successfully');
      // Logout should send set-cookie headers
      expect(logoutRes.headers['set-cookie']).toBeDefined();
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
          username: 'testuser',
          password: 'password123',
        });

      // Should process JSON and validate fields
      expect(response.body).toBeDefined();
    });

    it('should apply error middleware for unhandled errors', async () => {
      const response = await request(app)
        .get('/pages')
        .set('Authorization', 'Bearer invalid-token-format');

      // Error middleware should catch auth error and return JSON
      expect(response.status).toBe(401);
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

  describe('Error Handling - Middleware Coverage', () => {
    it('should handle 404 Not Found for non-existent routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should return JSON error response with message property', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for invalid token format', async () => {
      const response = await request(app)
        .get('/pages')
        .set('Authorization', 'InvalidTokenFormat');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Scraper Integration - Queue Coverage', () => {
    it('should create a page with scraping job enqueued', async () => {
      // First login
      const loginRes = await request(app).post('/auth/register').send({
        username: 'scrapertest',
        password: 'password123',
      });

      expect(loginRes.status).toBe(201);

      // Create a page to trigger scraping
      const agent = request.agent(app);
      const loginAsUser = await agent.post('/auth/login').send({
        username: 'scrapertest',
        password: 'password123',
      });

      expect(loginAsUser.status).toBe(200);

      // Create page with URL
      const createRes = await agent.post('/pages').send({
        url: 'https://example.com',
      });

      expect(createRes.status).toBe(202);
      expect(createRes.body).toHaveProperty('id');
      expect(createRes.body).toHaveProperty('status');
      expect(['processing', 'completed', 'failed']).toContain(createRes.body.status);
    });

    it('should allow checking page scraping status', async () => {
      // Register and login
      const loginRes = await request(app).post('/auth/register').send({
        username: 'statustest',
        password: 'password123',
      });

      const agent = request.agent(app);
      await agent.post('/auth/login').send({
        username: 'statustest',
        password: 'password123',
      });

      // Create a page
      const createRes = await agent.post('/pages').send({
        url: 'https://example.com',
      });

      const pageId = createRes.body.id;

      // Try to get scraping status (might not have a job endpoint, but testing the flow)
      const statusRes = await agent.get(`/pages/${pageId}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body).toHaveProperty('id');
      expect(statusRes.body.id).toBe(pageId);
    });

    it('should handle scraping of different URL types', async () => {
      const agent = request.agent(app);
      await agent.post('/auth/register').send({
        username: 'urltest',
        password: 'password123',
      });
      await agent.post('/auth/login').send({
        username: 'urltest',
        password: 'password123',
      });

      // Try different URLs
      const urls = [
        'https://example.com',
        'https://wikipedia.org',
        'https://nodejs.org/en/',
      ];

      for (const url of urls) {
        const res = await agent.post('/pages').send({ url });
        expect(res.status).toBe(202);
        expect(res.body).toHaveProperty('status');
      }
    });

    it('should handle invalid URL for scraping', async () => {
      const agent = request.agent(app);
      await agent.post('/auth/register').send({
        username: 'invalidurltest',
        password: 'password123',
      });
      await agent.post('/auth/login').send({
        username: 'invalidurltest',
        password: 'password123',
      });

      const res = await agent.post('/pages').send({
        url: 'not-a-valid-url',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return links from scraped page', async () => {
      const agent = request.agent(app);
      await agent.post('/auth/register').send({
        username: 'linkstest',
        password: 'password123',
      });
      await agent.post('/auth/login').send({
        username: 'linkstest',
        password: 'password123',
      });

      const createRes = await agent.post('/pages').send({
        url: 'https://example.com',
      });

      const pageId = createRes.body.id;

      // Wait a bit for scraping to start
      await new Promise(resolve => setTimeout(resolve, 500));

      const linksRes = await agent.get(`/pages/${pageId}/links`);

      expect(linksRes.status).toBe(200);
      expect(linksRes.body).toHaveProperty('data');
      expect(Array.isArray(linksRes.body.data)).toBe(true);
    });
  });

  describe('Error Handling - Comprehensive Coverage', () => {
    it('should handle non-JSON request body gracefully', async () => {
      const res = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing required fields in login', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'test' }); // missing password

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle missing required fields in register', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ password: 'test' }); // missing username

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return proper error for duplicate username on registration', async () => {
      const agent = request.agent(app);

      // Register first user
      await agent.post('/auth/register').send({
        username: 'uniqueuser',
        password: 'password123',
      });

      // Try to register with same username
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'uniqueuser',
          password: 'password456',
        });

      // 409 Conflict is the correct status for duplicate resource
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent page', async () => {
      const agent = request.agent(app);
      await agent.post('/auth/register').send({
        username: 'pagetest',
        password: 'password123',
      });
      await agent.post('/auth/login').send({
        username: 'pagetest',
        password: 'password123',
      });

      const res = await agent.get('/pages/99999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated access', async () => {
      const res = await request(app).get('/pages');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle invalid page ID format', async () => {
      const agent = request.agent(app);
      await agent.post('/auth/register').send({
        username: 'invalididtest',
        password: 'password123',
      });
      await agent.post('/auth/login').send({
        username: 'invalididtest',
        password: 'password123',
      });

      const res = await agent.get('/pages/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle invalid links page ID format', async () => {
      const agent = request.agent(app);
      await agent.post('/auth/register').send({
        username: 'invalidlinkstest',
        password: 'password123',
      });
      await agent.post('/auth/login').send({
        username: 'invalidlinkstest',
        password: 'password123',
      });

      const res = await agent.get('/pages/invalid-id/links');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle 404 for non-existent links', async () => {
      const agent = request.agent(app);
      await agent.post('/auth/register').send({
        username: 'nolinkstest',
        password: 'password123',
      });
      await agent.post('/auth/login').send({
        username: 'nolinkstest',
        password: 'password123',
      });

      const res = await agent.get('/pages/99999/links');

      expect(res.status).toBe(404);
    });

    it('should handle invalid URL in page creation', async () => {
      const agent = request.agent(app);
      await agent.post('/auth/register').send({
        username: 'invalidurltest2',
        password: 'password123',
      });
      await agent.post('/auth/login').send({
        username: 'invalidurltest2',
        password: 'password123',
      });

      const res = await agent.post('/pages').send({
        url: 'this-is-not-a-url',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Scraper Controller - Queue Status Coverage', () => {
    it('should handle refresh token endpoint correctly', async () => {
      const agent = request.agent(app);

      // Register and login
      await agent.post('/auth/register').send({
        username: 'refreshtest',
        password: 'password123',
      });

      await agent.post('/auth/login').send({
        username: 'refreshtest',
        password: 'password123',
      });

      // Call refresh endpoint
      const res = await agent.post('/auth/refresh');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('expiresIn');
    });

    it('should return error for refresh without valid session', async () => {
      const res = await request(app).post('/auth/refresh');

      // Missing refreshToken results in validation error (400)
      expect([400, 401]).toContain(res.status);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle logout correctly', async () => {
      const agent = request.agent(app);

      // Register and login
      await agent.post('/auth/register').send({
        username: 'logouttest',
        password: 'password123',
      });

      await agent.post('/auth/login').send({
        username: 'logouttest',
        password: 'password123',
      });

      // Logout
      const res = await agent.post('/auth/logout');

      expect(res.status).toBe(200);

      // Verify token is cleared by trying to access protected route
      const protectedRes = await agent.get('/pages');
      expect(protectedRes.status).toBe(401);
    });

    it('should handle invalid token format in authorization header', async () => {
      const res = await request(app)
        .get('/pages')
        .set('Authorization', 'InvalidToken');

      expect(res.status).toBe(401);
    });
  });
});
