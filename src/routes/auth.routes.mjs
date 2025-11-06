import express from 'express';

const router = express.Router();

// Smoke test endpoint
router.post('/register', (req, res) => {
  res.status(200).json({ message: 'Auth register endpoint (smoke test)' });
});

router.post('/login', (req, res) => {
  res.status(200).json({ message: 'Auth login endpoint (smoke test)' });
});

export default router;
