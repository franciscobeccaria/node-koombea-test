import { fetch } from 'undici';
import * as cheerio from 'cheerio';

const TIMEOUT = 12000;

export const scrapeUrl = async (url) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text() || 'No title found';

    // Extract and normalize links
    const linksSet = new Set();
    const links = [];

    $('a').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text()?.trim() || '';

      if (!href) return;

      const absoluteUrl = normalizeUrl(url, href);
      if (!absoluteUrl) return;

      if (!linksSet.has(absoluteUrl)) {
        linksSet.add(absoluteUrl);
        links.push({
          href: absoluteUrl,
          text: text.substring(0, 255),
        });
      }
    });

    return {
      title,
      links,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Scrape timeout: exceeded 12 seconds');
    }
    throw error;
  }
};

const normalizeUrl = (baseUrl, href) => {
  try {
    if (!href) return null;

    // Already absolute URL
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }

    // Protocol-relative URL
    if (href.startsWith('//')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${href.substring(2)}`;
    }

    // Relative URL
    const base = new URL(baseUrl);
    const absolute = new URL(href, base.href);
    return absolute.href;
  } catch {
    return null;
  }
};
