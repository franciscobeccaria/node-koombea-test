import { scrapeUrl } from '../utils/scraper.mjs';
import * as pagesRepository from '../repositories/pages.repository.mjs';
import { enqueueScrapeJob } from '../queue/scraperQueue.mjs';

export const createPageWithAsyncScrape = async (url, userId) => {
  if (!url) {
    const error = new Error('URL is required');
    error.status = 400;
    throw error;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    const error = new Error('Invalid URL format');
    error.status = 400;
    throw error;
  }

  // Create page in DB with empty title (will be updated after scraping)
  const page = await pagesRepository.createPage(userId, url, 'Processing...');

  // Enqueue scraping job
  try {
    await enqueueScrapeJob(page.id, userId, url);
  } catch (error) {
    console.error('Failed to enqueue scrape job:', error);
    // Job enqueueing failed, but page was created. Log and return page anyway.
  }

  return {
    id: page.id,
    url: page.url,
    title: page.title,
    linkCount: page.linkCount,
    createdAt: page.createdAt,
    status: page.status,
  };
};

export const listPages = async (userId, limit, offset) => {
  const pages = await pagesRepository.findPagesByUser(userId, limit, offset);
  const total = await pagesRepository.countPagesByUser(userId);

  return {
    data: pages,
    pagination: {
      limit,
      offset,
      total,
    },
  };
};

export const getPage = async (id, userId) => {
  const page = await pagesRepository.findPageById(id, userId);

  if (!page) {
    const error = new Error('Page not found');
    error.status = 404;
    throw error;
  }

  return page;
};

export const listLinks = async (pageId, userId, limit, offset) => {
  // Verify page belongs to user
  const page = await pagesRepository.findPageById(pageId, userId);

  if (!page) {
    const error = new Error('Page not found');
    error.status = 404;
    throw error;
  }

  const links = await pagesRepository.findLinksByPage(pageId, limit, offset);
  const total = await pagesRepository.countLinksByPage(pageId);

  return {
    data: links,
    pagination: {
      limit,
      offset,
      total,
    },
  };
};
