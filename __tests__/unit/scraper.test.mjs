import { scrapeUrl } from '../../src/utils/scraper.mjs';

describe('Scraper Utility', () => {
  describe('scrapeUrl', () => {
    it('should be a function', () => {
      expect(typeof scrapeUrl).toBe('function');
    });

    it('should throw on invalid URL without protocol', async () => {
      await expect(scrapeUrl('example.com')).rejects.toThrow();
    });

    it('should throw on invalid URL', async () => {
      await expect(scrapeUrl('not-a-valid-url')).rejects.toThrow();
    });

    it('should handle a valid URL structure', async () => {
      // Just verify the function processes valid URLs without throwing validation errors
      try {
        await scrapeUrl('https://example.com');
      } catch (error) {
        // Network/timeout errors are acceptable in unit tests
        // We're just checking that URL validation passes
        expect(['AbortError', 'fetch failed', 'Scrape timeout'].some(msg =>
          error.message.includes(msg)
        )).toBe(true);
      }
    });
  });
});
