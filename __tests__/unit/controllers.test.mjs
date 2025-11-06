import { jest } from '@jest/globals';

// Mock pages service before importing controller
jest.unstable_mockModule('../../src/services/pages.service.mjs', () => ({
  createPageAndScrapeInline: jest.fn(),
  listPages: jest.fn(),
  getPage: jest.fn(),
  listLinks: jest.fn(),
}));

const pagesService = await import('../../src/services/pages.service.mjs');
const pagesController = await import('../../src/controllers/pages.controller.mjs');

describe('Pages Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { userId: 'user-1' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('createPage', () => {
    it('should create a page with valid URL', async () => {
      const mockPage = {
        id: 'page-1',
        userId: 'user-1',
        url: 'https://example.com',
        title: 'Example',
        linkCount: 0,
      };
      req.body = { url: 'https://example.com' };
      pagesService.createPageAndScrapeInline.mockResolvedValue(mockPage);

      await pagesController.createPage(req, res, next);

      expect(pagesService.createPageAndScrapeInline).toHaveBeenCalledWith('https://example.com', 'user-1');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockPage);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Service error');
      req.body = { url: 'https://example.com' };
      pagesService.createPageAndScrapeInline.mockRejectedValue(error);

      await pagesController.createPage(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listPages', () => {
    it('should list pages with default pagination', async () => {
      const mockResult = {
        pages: [
          {
            id: 'page-1',
            userId: 'user-1',
            url: 'https://example.com',
            title: 'Example',
            linkCount: 5,
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      };
      pagesService.listPages.mockResolvedValue(mockResult);

      await pagesController.listPages(req, res, next);

      expect(pagesService.listPages).toHaveBeenCalledWith('user-1', 20, 0);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('should list pages with custom pagination', async () => {
      const mockResult = { pages: [], total: 0, limit: 10, offset: 5 };
      req.query = { limit: '10', offset: '5' };
      pagesService.listPages.mockResolvedValue(mockResult);

      await pagesController.listPages(req, res, next);

      expect(pagesService.listPages).toHaveBeenCalledWith('user-1', 10, 5);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should enforce limit bounds (max 100)', async () => {
      const mockResult = { pages: [], total: 0, limit: 20, offset: 0 };
      req.query = { limit: '200' };
      pagesService.listPages.mockResolvedValue(mockResult);

      await pagesController.listPages(req, res, next);

      expect(pagesService.listPages).toHaveBeenCalledWith('user-1', 20, 0);
    });

    it('should enforce limit bounds (min 1)', async () => {
      const mockResult = { pages: [], total: 0, limit: 20, offset: 0 };
      req.query = { limit: '0' };
      pagesService.listPages.mockResolvedValue(mockResult);

      await pagesController.listPages(req, res, next);

      expect(pagesService.listPages).toHaveBeenCalledWith('user-1', 20, 0);
    });

    it('should enforce offset bounds (min 0)', async () => {
      const mockResult = { pages: [], total: 0, limit: 20, offset: 0 };
      req.query = { offset: '-5' };
      pagesService.listPages.mockResolvedValue(mockResult);

      await pagesController.listPages(req, res, next);

      expect(pagesService.listPages).toHaveBeenCalledWith('user-1', 20, 0);
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Service error');
      pagesService.listPages.mockRejectedValue(error);

      await pagesController.listPages(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getPage', () => {
    it('should get page by id', async () => {
      const mockPage = {
        id: 'page-1',
        userId: 'user-1',
        url: 'https://example.com',
        title: 'Example',
        linkCount: 5,
      };
      req.params = { id: '1' };
      pagesService.getPage.mockResolvedValue(mockPage);

      await pagesController.getPage(req, res, next);

      expect(pagesService.getPage).toHaveBeenCalledWith(1, 'user-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPage);
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw error for invalid page ID (0)', async () => {
      req.params = { id: '0' };

      await pagesController.getPage(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid page ID');
      expect(error.status).toBe(400);
      expect(pagesService.getPage).not.toHaveBeenCalled();
    });

    it('should throw error for non-numeric page ID', async () => {
      req.params = { id: 'abc' };

      await pagesController.getPage(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid page ID');
      expect(error.status).toBe(400);
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Service error');
      req.params = { id: '1' };
      pagesService.getPage.mockRejectedValue(error);

      await pagesController.getPage(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listLinks', () => {
    it('should list links for a page with default pagination', async () => {
      const mockResult = {
        links: [
          {
            id: 'link-1',
            href: 'https://example.com/1',
            text: 'Link 1',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      };
      req.params = { id: '1' };
      pagesService.listLinks.mockResolvedValue(mockResult);

      await pagesController.listLinks(req, res, next);

      expect(pagesService.listLinks).toHaveBeenCalledWith(1, 'user-1', 20, 0);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('should list links with custom pagination', async () => {
      const mockResult = { links: [], total: 0, limit: 10, offset: 5 };
      req.params = { id: '1' };
      req.query = { limit: '10', offset: '5' };
      pagesService.listLinks.mockResolvedValue(mockResult);

      await pagesController.listLinks(req, res, next);

      expect(pagesService.listLinks).toHaveBeenCalledWith(1, 'user-1', 10, 5);
    });

    it('should enforce limit bounds (max 100)', async () => {
      const mockResult = { links: [], total: 0, limit: 20, offset: 0 };
      req.params = { id: '1' };
      req.query = { limit: '200' };
      pagesService.listLinks.mockResolvedValue(mockResult);

      await pagesController.listLinks(req, res, next);

      expect(pagesService.listLinks).toHaveBeenCalledWith(1, 'user-1', 20, 0);
    });

    it('should enforce limit bounds (min 1)', async () => {
      const mockResult = { links: [], total: 0, limit: 20, offset: 0 };
      req.params = { id: '1' };
      req.query = { limit: '0' };
      pagesService.listLinks.mockResolvedValue(mockResult);

      await pagesController.listLinks(req, res, next);

      expect(pagesService.listLinks).toHaveBeenCalledWith(1, 'user-1', 20, 0);
    });

    it('should enforce offset bounds (min 0)', async () => {
      const mockResult = { links: [], total: 0, limit: 20, offset: 0 };
      req.params = { id: '1' };
      req.query = { offset: '-5' };
      pagesService.listLinks.mockResolvedValue(mockResult);

      await pagesController.listLinks(req, res, next);

      expect(pagesService.listLinks).toHaveBeenCalledWith(1, 'user-1', 20, 0);
    });

    it('should throw error for invalid page ID (0)', async () => {
      req.params = { id: '0' };

      await pagesController.listLinks(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid page ID');
      expect(error.status).toBe(400);
      expect(pagesService.listLinks).not.toHaveBeenCalled();
    });

    it('should throw error for non-numeric page ID', async () => {
      req.params = { id: 'abc' };

      await pagesController.listLinks(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid page ID');
      expect(error.status).toBe(400);
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Service error');
      req.params = { id: '1' };
      pagesService.listLinks.mockRejectedValue(error);

      await pagesController.listLinks(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
