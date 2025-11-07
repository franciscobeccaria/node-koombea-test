import { jest } from '@jest/globals';

// Mock repositories and utils before importing services
jest.unstable_mockModule('../../src/repositories/pages.repository.mjs', () => ({
  createPage: jest.fn(),
  findPagesByUser: jest.fn(),
  countPagesByUser: jest.fn(),
  findPageById: jest.fn(),
  createManyLinks: jest.fn(),
  findLinksByPage: jest.fn(),
  countLinksByPage: jest.fn(),
  updatePageLinkCount: jest.fn(),
}));

jest.unstable_mockModule('../../src/repositories/auth.repository.mjs', () => ({
  findUserByUsername: jest.fn(),
  findUserById: jest.fn(),
  createUser: jest.fn(),
}));

jest.unstable_mockModule('../../src/utils/scraper.mjs', () => ({
  scrapeUrl: jest.fn(),
}));

jest.unstable_mockModule('../../src/queue/scraperQueue.mjs', () => ({
  enqueueScrapeJob: jest.fn(),
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

const pagesRepository = await import('../../src/repositories/pages.repository.mjs');
const authRepository = await import('../../src/repositories/auth.repository.mjs');
const scraper = await import('../../src/utils/scraper.mjs');
const scraperQueue = await import('../../src/queue/scraperQueue.mjs');
const bcrypt = await import('bcryptjs');
const jwt = await import('jsonwebtoken');
const pagesService = await import('../../src/services/pages.service.mjs');
const authService = await import('../../src/services/auth.service.mjs');

describe('Pages Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPageAndScrapeInline', () => {
    it('should throw error if URL is missing', async () => {
      await expect(pagesService.createPageAndScrapeInline('', 'user-1')).rejects.toThrow(
        'URL is required'
      );
    });

    it('should throw error if URL format is invalid', async () => {
      await expect(
        pagesService.createPageAndScrapeInline('not-a-valid-url', 'user-1')
      ).rejects.toThrow('Invalid URL format');
    });

    it('should create page with scraped data', async () => {
      const mockScrapedData = {
        title: 'Example Page',
        links: [
          { href: 'https://example.com/1', text: 'Link 1' },
          { href: 'https://example.com/2', text: 'Link 2' },
        ],
      };
      const mockPage = {
        id: 'page-1',
        userId: 'user-1',
        url: 'https://example.com',
        title: 'Example Page',
        linkCount: 0,
        createdAt: new Date(),
      };
      scraper.scrapeUrl.mockResolvedValue(mockScrapedData);
      pagesRepository.createPage.mockResolvedValue(mockPage);
      pagesRepository.createManyLinks.mockResolvedValue({ count: 2 });
      pagesRepository.updatePageLinkCount.mockResolvedValue({
        ...mockPage,
        linkCount: 2,
      });

      const result = await pagesService.createPageAndScrapeInline('https://example.com', 'user-1');

      expect(scraper.scrapeUrl).toHaveBeenCalledWith('https://example.com');
      expect(pagesRepository.createPage).toHaveBeenCalledWith('user-1', 'https://example.com', 'Example Page');
      expect(pagesRepository.createManyLinks).toHaveBeenCalledWith('page-1', mockScrapedData.links);
      expect(pagesRepository.updatePageLinkCount).toHaveBeenCalledWith('page-1', 2);
      expect(result).toEqual({
        id: 'page-1',
        url: 'https://example.com',
        title: 'Example Page',
        linkCount: 2,
        links: mockScrapedData.links,
        createdAt: mockPage.createdAt,
      });
    });

    it('should create page with no links', async () => {
      const mockScrapedData = {
        title: 'Example Page',
        links: [],
      };
      const mockPage = {
        id: 'page-1',
        userId: 'user-1',
        url: 'https://example.com',
        title: 'Example Page',
        linkCount: 0,
        createdAt: new Date(),
      };
      scraper.scrapeUrl.mockResolvedValue(mockScrapedData);
      pagesRepository.createPage.mockResolvedValue(mockPage);

      const result = await pagesService.createPageAndScrapeInline('https://example.com', 'user-1');

      expect(pagesRepository.createManyLinks).not.toHaveBeenCalled();
      expect(pagesRepository.updatePageLinkCount).not.toHaveBeenCalled();
      expect(result.linkCount).toBe(0);
    });
  });

  describe('createPageWithAsyncScrape', () => {
    it('should throw error if URL is missing', async () => {
      await expect(pagesService.createPageWithAsyncScrape('', 'user-1')).rejects.toThrow(
        'URL is required'
      );
    });

    it('should throw error if URL format is invalid', async () => {
      await expect(
        pagesService.createPageWithAsyncScrape('not-a-valid-url', 'user-1')
      ).rejects.toThrow('Invalid URL format');
    });

    it('should create page and return processing status', async () => {
      const mockPage = {
        id: 'page-1',
        url: 'https://example.com',
        title: 'Processing...',
        linkCount: 0,
        status: 'processing',
        createdAt: new Date(),
      };
      pagesRepository.createPage.mockResolvedValue(mockPage);
      scraperQueue.enqueueScrapeJob.mockResolvedValue({ id: 'job-1' });

      const result = await pagesService.createPageWithAsyncScrape('https://example.com', 'user-1');

      expect(pagesRepository.createPage).toHaveBeenCalledWith('user-1', 'https://example.com', 'Processing...');
      expect(scraperQueue.enqueueScrapeJob).toHaveBeenCalledWith('page-1', 'user-1', 'https://example.com');
      expect(result).toEqual({
        id: 'page-1',
        url: 'https://example.com',
        title: 'Processing...',
        linkCount: 0,
        createdAt: mockPage.createdAt,
        status: 'processing',
      });
    });
  });

  describe('listPages', () => {
    it('should list pages with pagination info', async () => {
      const mockPages = [
        {
          id: 'page-1',
          url: 'https://example.com',
          title: 'Example',
          linkCount: 5,
          status: 'completed',
          createdAt: new Date(),
        },
      ];
      pagesRepository.findPagesByUser.mockResolvedValue(mockPages);
      pagesRepository.countPagesByUser.mockResolvedValue(1);

      const result = await pagesService.listPages('user-1', 20, 0);

      expect(pagesRepository.findPagesByUser).toHaveBeenCalledWith('user-1', 20, 0);
      expect(pagesRepository.countPagesByUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        data: mockPages,
        pagination: {
          limit: 20,
          offset: 0,
          total: 1,
        },
      });
    });
  });

  describe('getPage', () => {
    it('should return page if found', async () => {
      const mockPage = {
        id: 'page-1',
        userId: 'user-1',
        url: 'https://example.com',
        title: 'Example',
        linkCount: 5,
      };
      pagesRepository.findPageById.mockResolvedValue(mockPage);

      const result = await pagesService.getPage('page-1', 'user-1');

      expect(pagesRepository.findPageById).toHaveBeenCalledWith('page-1', 'user-1');
      expect(result).toEqual(mockPage);
    });

    it('should throw 404 error if page not found', async () => {
      pagesRepository.findPageById.mockResolvedValue(null);

      await expect(pagesService.getPage('page-1', 'user-1')).rejects.toThrow('Page not found');
    });
  });

  describe('listLinks', () => {
    it('should return links with pagination info', async () => {
      const mockPage = {
        id: 'page-1',
        userId: 'user-1',
      };
      const mockLinks = [
        {
          id: 'link-1',
          href: 'https://example.com/1',
          text: 'Link 1',
          createdAt: new Date(),
        },
      ];
      pagesRepository.findPageById.mockResolvedValue(mockPage);
      pagesRepository.findLinksByPage.mockResolvedValue(mockLinks);
      pagesRepository.countLinksByPage.mockResolvedValue(1);

      const result = await pagesService.listLinks('page-1', 'user-1', 20, 0);

      expect(pagesRepository.findPageById).toHaveBeenCalledWith('page-1', 'user-1');
      expect(pagesRepository.findLinksByPage).toHaveBeenCalledWith('page-1', 20, 0);
      expect(pagesRepository.countLinksByPage).toHaveBeenCalledWith('page-1');
      expect(result).toEqual({
        data: mockLinks,
        pagination: {
          limit: 20,
          offset: 0,
          total: 1,
        },
      });
    });

    it('should throw 404 error if page not found', async () => {
      pagesRepository.findPageById.mockResolvedValue(null);

      await expect(pagesService.listLinks('page-1', 'user-1', 20, 0)).rejects.toThrow(
        'Page not found'
      );
    });
  });
});

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser - input validation', () => {
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
  });

  describe('registerUser - user already exists', () => {
    it('should throw error if user already exists', async () => {
      authRepository.findUserByUsername.mockResolvedValue({ id: 'user-1', username: 'testuser' });

      await expect(authService.registerUser('testuser', 'password123')).rejects.toThrow(
        'User already exists'
      );
    });
  });

  describe('registerUser - success', () => {
    it('should register new user and return tokens', async () => {
      const mockUser = { id: 'user-1', username: 'newuser', createdAt: new Date() };
      authRepository.findUserByUsername.mockResolvedValue(null);
      bcrypt.default.hash.mockResolvedValue('hashed-password');
      authRepository.createUser.mockResolvedValue(mockUser);
      jwt.default.sign.mockReturnValue('fake-token');

      const result = await authService.registerUser('newuser', 'password123');

      expect(authRepository.findUserByUsername).toHaveBeenCalledWith('newuser');
      expect(bcrypt.default.hash).toHaveBeenCalledWith('password123', 10);
      expect(authRepository.createUser).toHaveBeenCalledWith('newuser', 'hashed-password');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('loginUser - input validation', () => {
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

  describe('loginUser - user not found', () => {
    it('should throw error if user not found', async () => {
      authRepository.findUserByUsername.mockResolvedValue(null);

      await expect(authService.loginUser('nonexistent', 'password123')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('loginUser - invalid password', () => {
    it('should throw error if password is invalid', async () => {
      const mockUser = { id: 'user-1', username: 'testuser', password: 'hashed-password' };
      authRepository.findUserByUsername.mockResolvedValue(mockUser);
      bcrypt.default.compare.mockResolvedValue(false);

      await expect(authService.loginUser('testuser', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('loginUser - success', () => {
    it('should login user and return tokens', async () => {
      const mockUser = { id: 'user-1', username: 'testuser', password: 'hashed-password' };
      authRepository.findUserByUsername.mockResolvedValue(mockUser);
      bcrypt.default.compare.mockResolvedValue(true);
      jwt.default.sign.mockReturnValue('fake-token');

      const result = await authService.loginUser('testuser', 'password123');

      expect(authRepository.findUserByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.default.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.username).toBe('testuser');
    });
  });

  describe('verifyAccessToken', () => {
    it('should throw error on invalid token', () => {
      jwt.default.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      expect(() => authService.verifyAccessToken('invalid.token')).toThrow('Invalid or expired token');
    });

    it('should return decoded token on valid token', () => {
      const mockDecodedToken = { userId: 'user-1' };
      jwt.default.verify.mockReturnValue(mockDecodedToken);

      const result = authService.verifyAccessToken('valid.token.here');

      expect(result).toEqual(mockDecodedToken);
    });
  });
});
