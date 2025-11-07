import app from './app.mjs';
import ENV from './utils/env.mjs';
import { scraperWorker } from './queue/scraperQueue.mjs';

const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${ENV.NODE_ENV}`);
});

console.log('Initializing scraper worker...');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    console.log('Server closed');
    await scraperWorker.close();
    process.exit(0);
  });
});
