import express from 'express';

const router = express.Router();

// Smoke test endpoints
router.post('/', (req, res) => {
  res.status(200).json({ message: 'Pages create endpoint (smoke test)' });
});

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Pages list endpoint (smoke test)' });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ message: 'Pages detail endpoint (smoke test)' });
});

router.get('/:id/links', (req, res) => {
  res.status(200).json({ message: 'Pages links endpoint (smoke test)' });
});

export default router;
