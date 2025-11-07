import express from 'express';
import authGuard from '../middlewares/auth-guard.mjs';
import { pagesLimiter } from '../middlewares/rateLimit.mjs';
import * as pagesController from '../controllers/pages.controller.mjs';
import * as scraperController from '../controllers/scraper.controller.mjs';

const router = express.Router();

router.use(authGuard);
router.use(pagesLimiter);

router.post('/', pagesController.createPage);
router.get('/', pagesController.listPages);
router.get('/:id', pagesController.getPage);
router.get('/:id/links', pagesController.listLinks);
router.get('/:pageId/scrape-status', scraperController.getScrapingStatus);

export default router;
