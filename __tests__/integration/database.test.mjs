import { beforeAll, afterAll, describe, it, expect, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import * as authRepository from '../../src/repositories/auth.repository.mjs';
import * as pagesRepository from '../../src/repositories/pages.repository.mjs';

let prisma;

describe('Database Integration Tests with Real PostgreSQL', () => {
  beforeAll(async () => {
    // Create Prisma instance with database from environment
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Test connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error.message);
      throw new Error('Could not connect to database. Ensure docker-compose is running.');
    }
  }, 60000);

  afterAll(async () => {
    // Clean up
    if (prisma) {
      await prisma.$disconnect();
    }
  }, 60000);

  beforeEach(async () => {
    // Clear all data before each test
    await prisma.link.deleteMany({});
    await prisma.page.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Auth Repository', () => {
    it('should create and find user by username', async () => {
      // Create user
      const user = await authRepository.createUser('testuser', 'hashed-password');
      expect(user.username).toBe('testuser');
      expect(user.id).toBeDefined();

      // Find user
      const foundUser = await authRepository.findUserByUsername('testuser');
      expect(foundUser).toBeDefined();
      expect(foundUser.username).toBe('testuser');
      expect(foundUser.password).toBe('hashed-password');
    });

    it('should not find non-existent user', async () => {
      const result = await authRepository.findUserByUsername('nonexistent');
      expect(result).toBeNull();
    });

    it('should enforce unique username constraint', async () => {
      // Create first user
      await authRepository.createUser('testuser', 'password1');

      // Try to create duplicate - should throw
      await expect(authRepository.createUser('testuser', 'password2')).rejects.toThrow();
    });

    it('should find user by ID', async () => {
      const created = await authRepository.createUser('testuser', 'password');
      const found = await authRepository.findUserById(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.username).toBe('testuser');
    });
  });

  describe('Pages Repository', () => {
    let userId;

    beforeEach(async () => {
      // Create a user for each test
      const user = await authRepository.createUser('testuser', 'password');
      userId = user.id;
    });

    it('should create and list pages for user', async () => {
      // Create page
      const page = await pagesRepository.createPage(userId, 'https://example.com', 'Example');
      expect(page.id).toBeDefined();
      expect(page.title).toBe('Example');
      expect(page.linkCount).toBe(0);

      // List pages
      const pages = await pagesRepository.findPagesByUser(userId, 20, 0);
      expect(pages.length).toBe(1);
      expect(pages[0].id).toBe(page.id);
    });

    it('should count pages for user', async () => {
      await pagesRepository.createPage(userId, 'https://example1.com', 'Example 1');
      await pagesRepository.createPage(userId, 'https://example2.com', 'Example 2');

      const count = await pagesRepository.countPagesByUser(userId);
      expect(count).toBe(2);
    });

    it('should find page by ID and verify ownership', async () => {
      const created = await pagesRepository.createPage(userId, 'https://example.com', 'Example');
      const found = await pagesRepository.findPageById(created.id, userId);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should return null when finding page with wrong user ID', async () => {
      const created = await pagesRepository.createPage(userId, 'https://example.com', 'Example');

      // Try to access with different user ID
      const found = await pagesRepository.findPageById(created.id, userId + 999);
      expect(found).toBeNull();
    });

    it('should create multiple links for page', async () => {
      const page = await pagesRepository.createPage(userId, 'https://example.com', 'Example');

      const links = [
        { href: 'https://example.com/1', text: 'Link 1' },
        { href: 'https://example.com/2', text: 'Link 2' },
        { href: 'https://example.com/3', text: 'Link 3' },
      ];

      await pagesRepository.createManyLinks(page.id, links);
      const result = await pagesRepository.updatePageLinkCount(page.id, links.length);

      expect(result.linkCount).toBe(3);
    });

    it('should find links by page with pagination', async () => {
      const page = await pagesRepository.createPage(userId, 'https://example.com', 'Example');

      const links = Array.from({ length: 25 }, (_, i) => ({
        href: `https://example.com/${i}`,
        text: `Link ${i}`,
      }));

      await pagesRepository.createManyLinks(page.id, links);

      // Get first page
      const firstPage = await pagesRepository.findLinksByPage(page.id, 10, 0);
      expect(firstPage.length).toBe(10);

      // Get second page
      const secondPage = await pagesRepository.findLinksByPage(page.id, 10, 10);
      expect(secondPage.length).toBe(10);

      // Get total count
      const count = await pagesRepository.countLinksByPage(page.id);
      expect(count).toBe(25);
    });

    it('should handle pagination boundaries correctly', async () => {
      const page = await pagesRepository.createPage(userId, 'https://example.com', 'Example');

      const links = Array.from({ length: 15 }, (_, i) => ({
        href: `https://example.com/${i}`,
        text: `Link ${i}`,
      }));

      await pagesRepository.createManyLinks(page.id, links);

      // Request more than available
      const result = await pagesRepository.findLinksByPage(page.id, 100, 0);
      expect(result.length).toBe(15);

      // Request with offset beyond available
      const empty = await pagesRepository.findLinksByPage(page.id, 10, 100);
      expect(empty.length).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    it('should delete links when page is deleted', async () => {
      const user = await authRepository.createUser('testuser', 'password');
      const page = await pagesRepository.createPage(user.id, 'https://example.com', 'Example');

      const links = [{ href: 'https://example.com/1', text: 'Link 1' }];
      await pagesRepository.createManyLinks(page.id, links);

      // Delete page via Prisma
      await prisma.page.delete({ where: { id: page.id } });

      // Verify links are gone
      const remaining = await pagesRepository.countLinksByPage(page.id);
      expect(remaining).toBe(0);
    });

    it('should delete user pages when user is deleted', async () => {
      const user = await authRepository.createUser('testuser', 'password');
      await pagesRepository.createPage(user.id, 'https://example1.com', 'Example 1');
      await pagesRepository.createPage(user.id, 'https://example2.com', 'Example 2');

      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      // Verify pages are gone
      const pages = await pagesRepository.findPagesByUser(user.id, 20, 0);
      expect(pages.length).toBe(0);
    });
  });
});
