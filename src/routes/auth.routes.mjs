import express from 'express';
import * as authController from '../controllers/auth.controller.mjs';
import { authLimiter } from '../middlewares/rateLimit.mjs';

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authController.logout);

export default router;
