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
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  createUser: jest.fn(),
}));

jest.unstable_mockModule('../../src/utils/scraper.mjs', () => ({
  scrapeUrl: jest.fn(),
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

  describe('listPages', () => {
    it('should list pages with pagination info', async () => {
      const mockPages = [
        {
          id: 'page-1',
          url: 'https://example.com',
          title: 'Example',
          linkCount: 5,
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
    it('should throw error if email is missing', async () => {
      await expect(authService.registerUser('', 'password123')).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should throw error if password is missing', async () => {
      await expect(authService.registerUser('test@example.com', '')).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should throw error if password is less than 6 characters', async () => {
      await expect(authService.registerUser('test@example.com', 'pass')).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });
  });

  describe('registerUser - user already exists', () => {
    it('should throw error if user already exists', async () => {
      authRepository.findUserByEmail.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

      await expect(authService.registerUser('test@example.com', 'password123')).rejects.toThrow(
        'User already exists'
      );
    });
  });

  describe('registerUser - success', () => {
    it('should register new user and return tokens', async () => {
      const mockUser = { id: 'user-1', email: 'newuser@example.com', createdAt: new Date() };
      authRepository.findUserByEmail.mockResolvedValue(null);
      bcrypt.default.hash.mockResolvedValue('hashed-password');
      authRepository.createUser.mockResolvedValue(mockUser);
      jwt.default.sign.mockReturnValue('fake-token');

      const result = await authService.registerUser('newuser@example.com', 'password123');

      expect(authRepository.findUserByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(bcrypt.default.hash).toHaveBeenCalledWith('password123', 10);
      expect(authRepository.createUser).toHaveBeenCalledWith('newuser@example.com', 'hashed-password');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('loginUser - input validation', () => {
    it('should throw error if email is missing', async () => {
      await expect(authService.loginUser('', 'password123')).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should throw error if password is missing', async () => {
      await expect(authService.loginUser('test@example.com', '')).rejects.toThrow(
        'Email and password are required'
      );
    });
  });

  describe('loginUser - user not found', () => {
    it('should throw error if user not found', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await expect(authService.loginUser('nonexistent@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('loginUser - invalid password', () => {
    it('should throw error if password is invalid', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', password: 'hashed-password' };
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.default.compare.mockResolvedValue(false);

      await expect(authService.loginUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('loginUser - success', () => {
    it('should login user and return tokens', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', password: 'hashed-password' };
      authRepository.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.default.compare.mockResolvedValue(true);
      jwt.default.sign.mockReturnValue('fake-token');

      const result = await authService.loginUser('test@example.com', 'password123');

      expect(authRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.default.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe('test@example.com');
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
