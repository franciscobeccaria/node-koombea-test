import express from 'express';
import authGuard from '../middlewares/auth-guard.mjs';

const router = express.Router();

// Apply auth guard to all /pages routes
router.use(authGuard);

// Placeholder endpoints (will be implemented in Épica 3)
router.post('/', (req, res) => {
  res.status(200).json({ message: 'Pages create endpoint', userId: req.user.userId });
});

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Pages list endpoint', userId: req.user.userId });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ message: 'Pages detail endpoint', userId: req.user.userId });
});

router.get('/:id/links', (req, res) => {
  res.status(200).json({ message: 'Pages links endpoint', userId: req.user.userId });
});

export default router;
