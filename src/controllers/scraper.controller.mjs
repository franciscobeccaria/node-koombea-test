import { getJobStatus } from '../queue/scraperQueue.mjs';

/**
 * GET /pages/:pageId/scrape-status
 * Get the scraping status of a page
 */
export const getScrapingStatus = async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const jobId = `page-${pageId}`;

    const status = await getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({
        message: 'Job not found',
      });
    }

    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};
