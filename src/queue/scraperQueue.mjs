import { Queue, Worker } from 'bullmq';
import * as scraperUtil from '../utils/scraper.mjs';
import * as pagesRepository from '../repositories/pages.repository.mjs';

// Parse Redis connection from URL or use defaults
const parseRedisUrl = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
    };
  } catch {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };
  }
};

const redisConnection = parseRedisUrl();

export const scraperQueue = new Queue('scraping', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

export const scraperWorker = new Worker(
  'scraping',
  async (job) => {
    const { pageId, userId, url } = job.data;

    try {
      const scrapedData = await scraperUtil.scrapeUrl(url);
      await pagesRepository.updatePageTitleAndStatus(pageId, scrapedData.title, 'completed');

      if (scrapedData.links && scrapedData.links.length > 0) {
        await pagesRepository.createManyLinks(pageId, scrapedData.links);
        await pagesRepository.updatePageLinkCount(pageId, scrapedData.links.length);
      }

      return {
        success: true,
        pageId,
        title: scrapedData.title,
        linksCount: scrapedData.links?.length || 0,
      };
    } catch (error) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        await pagesRepository.updatePageTitleAndStatus(pageId, `${domain} (Failed)`, 'failed');
      } catch (updateError) {
        console.error(`Failed to update page ${pageId} status:`, updateError);
      }
      throw new Error(`Scraping failed for URL ${url}: ${error.message}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

scraperWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

scraperWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

export const enqueueScrapeJob = async (pageId, userId, url) => {
  const job = await scraperQueue.add(
    'scrape',
    { pageId, userId, url },
    {
      jobId: `page-${pageId}`,
    }
  );
  return job;
};

export const getJobStatus = async (jobId) => {
  const job = await scraperQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job._progress;

  return {
    jobId: job.id,
    state,
    progress,
    data: job.data,
    result: job.returnvalue,
  };
};

export const closeQueue = async () => {
  await scraperQueue.close();
  await scraperWorker.close();
};
