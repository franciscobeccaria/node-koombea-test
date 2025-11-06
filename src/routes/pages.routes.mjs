import express from 'express';
import authGuard from '../middlewares/auth-guard.mjs';
import * as pagesController from '../controllers/pages.controller.mjs';

const router = express.Router();

router.use(authGuard);

router.post('/', pagesController.createPage);
router.get('/', pagesController.listPages);
router.get('/:id', pagesController.getPage);
router.get('/:id/links', pagesController.listLinks);

export default router;
