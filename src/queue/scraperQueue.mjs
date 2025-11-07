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

// Initialize queue
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

// Initialize worker
export const scraperWorker = new Worker(
  'scraping',
  async (job) => {
    const { pageId, userId, url } = job.data;

    try {
      // Scrape the URL
      const scrapedData = await scraperUtil.scrapeUrl(url);

      // Store links in database
      if (scrapedData.links && scrapedData.links.length > 0) {
        await pagesRepository.createManyLinks(pageId, scrapedData.links);
        await pagesRepository.updatePageLinkCount(pageId, scrapedData.links.length);
      }

      return {
        success: true,
        pageId,
        linksCount: scrapedData.links?.length || 0,
      };
    } catch (error) {
      throw new Error(`Scraping failed for URL ${url}: ${error.message}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

// Event handlers
scraperWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

scraperWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

// Add job to queue
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

// Get job status
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

// Close connections gracefully
export const closeQueue = async () => {
  await scraperQueue.close();
  await scraperWorker.close();
};
