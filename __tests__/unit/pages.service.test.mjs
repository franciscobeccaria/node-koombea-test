import { jest } from '@jest/globals';
import * as pagesService from '../../src/services/pages.service.mjs';

describe('Pages Service - Input Validation', () => {
  describe('createPageAndScrapeInline', () => {
    it('should throw error if URL is missing', async () => {
      await expect(pagesService.createPageAndScrapeInline('', 'user-123')).rejects.toThrow(
        'URL is required'
      );
    });

    it('should throw error if URL format is invalid', async () => {
      const invalidUrl = 'not-a-valid-url';
      await expect(pagesService.createPageAndScrapeInline(invalidUrl, 'user-123')).rejects.toThrow(
        'Invalid URL format'
      );
    });

    it('should throw error for URL without protocol', async () => {
      await expect(pagesService.createPageAndScrapeInline('example.com', 'user-123')).rejects.toThrow(
        'Invalid URL format'
      );
    });
  });
});
