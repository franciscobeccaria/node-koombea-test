import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middlewares/error.mjs';
import authRoutes from './routes/auth.routes.mjs';
import pagesRoutes from './routes/pages.routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/pages', pagesRoutes);

// HTML page routes (serve pages.html for /page/:id)
app.get('/page/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
