import * as pagesService from '../services/pages.service.mjs';

export const createPage = async (req, res, next) => {
  try {
    const { url } = req.body;
    const userId = req.user.userId;

    const page = await pagesService.createPageAndScrapeInline(url, userId);

    res.status(201).json(page);
  } catch (error) {
    next(error);
  }
};

export const listPages = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let limit = parseInt(req.query.limit) || 20;
    let offset = parseInt(req.query.offset) || 0;

    // Validate pagination
    if (limit < 1 || limit > 100) limit = 20;
    if (offset < 0) offset = 0;

    const result = await pagesService.listPages(userId, limit, offset);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const pageId = parseInt(id);
    if (!pageId) {
      const error = new Error('Invalid page ID');
      error.status = 400;
      throw error;
    }

    const page = await pagesService.getPage(pageId, userId);

    res.status(200).json(page);
  } catch (error) {
    next(error);
  }
};

export const listLinks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    let limit = parseInt(req.query.limit) || 20;
    let offset = parseInt(req.query.offset) || 0;

    // Validate pagination
    if (limit < 1 || limit > 100) limit = 20;
    if (offset < 0) offset = 0;

    const pageId = parseInt(id);
    if (!pageId) {
      const error = new Error('Invalid page ID');
      error.status = 400;
      throw error;
    }

    const result = await pagesService.listLinks(pageId, userId, limit, offset);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
