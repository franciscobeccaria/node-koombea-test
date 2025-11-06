import { jest } from '@jest/globals';

// Mock Prisma client before importing repositories
jest.unstable_mockModule('../../db/client.mjs', () => ({
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    page: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    link: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const { default: prisma } = await import('../../db/client.mjs');
const authRepository = await import('../../src/repositories/auth.repository.mjs');
const pagesRepository = await import('../../src/repositories/pages.repository.mjs');

describe('Auth Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = { id: '1', email: 'test@example.com', password: 'hash', createdAt: new Date() };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authRepository.findUserByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          password: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await authRepository.findUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create new user', async () => {
      const mockUser = {
        id: 'new-id',
        email: 'newuser@example.com',
        createdAt: new Date(),
      };
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await authRepository.createUser('newuser@example.com', 'hashed-password');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          password: 'hashed-password',
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user already exists', async () => {
      const error = new Error('Unique constraint failed');
      prisma.user.create.mockRejectedValue(error);

      await expect(authRepository.createUser('existing@example.com', 'password')).rejects.toThrow();
    });
  });
});

describe('Pages Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPage', () => {
    it('should create a new page', async () => {
      const mockPage = {
        id: 'page-1',
        userId: 'user-1',
        url: 'https://example.com',
        title: 'Example',
        linkCount: 0,
        createdAt: new Date(),
      };
      prisma.page.create.mockResolvedValue(mockPage);

      const result = await pagesRepository.createPage('user-1', 'https://example.com', 'Example');

      expect(prisma.page.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          url: 'https://example.com',
          title: 'Example',
        },
        select: {
          id: true,
          userId: true,
          url: true,
          title: true,
          linkCount: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockPage);
    });
  });

  describe('findPagesByUser', () => {
    it('should find pages by user with pagination', async () => {
      const mockPages = [
        {
          id: 'page-1',
          url: 'https://example.com',
          title: 'Example',
          linkCount: 5,
          createdAt: new Date(),
        },
      ];
      prisma.page.findMany.mockResolvedValue(mockPages);

      const result = await pagesRepository.findPagesByUser('user-1', 20, 0);

      expect(prisma.page.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: {
          id: true,
          url: true,
          title: true,
          linkCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
      expect(result).toEqual(mockPages);
    });

    it('should handle pagination correctly', async () => {
      prisma.page.findMany.mockResolvedValue([]);

      await pagesRepository.findPagesByUser('user-1', 10, 20);

      expect(prisma.page.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: {
          id: true,
          url: true,
          title: true,
          linkCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('countPagesByUser', () => {
    it('should count pages for a user', async () => {
      prisma.page.count.mockResolvedValue(5);

      const result = await pagesRepository.countPagesByUser('user-1');

      expect(prisma.page.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toBe(5);
    });

    it('should return 0 if user has no pages', async () => {
      prisma.page.count.mockResolvedValue(0);

      const result = await pagesRepository.countPagesByUser('user-1');

      expect(result).toBe(0);
    });
  });

  describe('findPageById', () => {
    it('should find page by id and user', async () => {
      const mockPage = {
        id: 'page-1',
        userId: 'user-1',
        url: 'https://example.com',
        title: 'Example',
        linkCount: 5,
        createdAt: new Date(),
      };
      prisma.page.findUnique.mockResolvedValue(mockPage);

      const result = await pagesRepository.findPageById('page-1', 'user-1');

      expect(prisma.page.findUnique).toHaveBeenCalledWith({
        where: { id: 'page-1' },
        select: {
          id: true,
          userId: true,
          url: true,
          title: true,
          linkCount: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockPage);
    });

    it('should return null if page not found', async () => {
      prisma.page.findUnique.mockResolvedValue(null);

      const result = await pagesRepository.findPageById('page-1', 'user-1');

      expect(result).toBeNull();
    });

    it('should return null if userId does not match', async () => {
      const mockPage = {
        id: 'page-1',
        userId: 'user-2',
        url: 'https://example.com',
        title: 'Example',
        linkCount: 5,
        createdAt: new Date(),
      };
      prisma.page.findUnique.mockResolvedValue(mockPage);

      const result = await pagesRepository.findPageById('page-1', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('createManyLinks', () => {
    it('should create multiple links for a page', async () => {
      prisma.link.createMany.mockResolvedValue({ count: 2 });

      const result = await pagesRepository.createManyLinks('page-1', [
        { href: 'https://example.com/1', text: 'Link 1' },
        { href: 'https://example.com/2', text: 'Link 2' },
      ]);

      expect(prisma.link.createMany).toHaveBeenCalledWith({
        data: [
          {
            pageId: 'page-1',
            href: 'https://example.com/1',
            text: 'Link 1',
          },
          {
            pageId: 'page-1',
            href: 'https://example.com/2',
            text: 'Link 2',
          },
        ],
      });
      expect(result).toEqual({ count: 2 });
    });

    it('should handle empty links array', async () => {
      const result = await pagesRepository.createManyLinks('page-1', []);

      expect(prisma.link.createMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findLinksByPage', () => {
    it('should find links for a page with pagination', async () => {
      const mockLinks = [
        { id: 'link-1', href: 'https://example.com/1', text: 'Link 1', createdAt: new Date() },
      ];
      prisma.link.findMany.mockResolvedValue(mockLinks);

      const result = await pagesRepository.findLinksByPage('page-1', 20, 0);

      expect(prisma.link.findMany).toHaveBeenCalledWith({
        where: { pageId: 'page-1' },
        select: {
          id: true,
          href: true,
          text: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
        skip: 0,
      });
      expect(result).toEqual(mockLinks);
    });
  });

  describe('countLinksByPage', () => {
    it('should count links for a page', async () => {
      prisma.link.count.mockResolvedValue(10);

      const result = await pagesRepository.countLinksByPage('page-1');

      expect(prisma.link.count).toHaveBeenCalledWith({
        where: { pageId: 'page-1' },
      });
      expect(result).toBe(10);
    });
  });

  describe('updatePageLinkCount', () => {
    it('should update page link count', async () => {
      const mockPage = {
        id: 'page-1',
        url: 'https://example.com',
        title: 'Example',
        linkCount: 10,
      };
      prisma.page.update.mockResolvedValue(mockPage);

      const result = await pagesRepository.updatePageLinkCount('page-1', 10);

      expect(prisma.page.update).toHaveBeenCalledWith({
        where: { id: 'page-1' },
        data: { linkCount: 10 },
        select: {
          id: true,
          url: true,
          title: true,
          linkCount: true,
        },
      });
      expect(result).toEqual(mockPage);
    });
  });
});
