# Koombea Technical Test - Web Scraper API

A Node.js REST API for web scraping and user authentication. Extract links and page titles from URLs with JWT-based authentication.

## Features

- User authentication (register/login with JWT)
- Web scraping with timeout and deduplication
- Link extraction from HTML pages
- Paginated listing of pages and links
- PostgreSQL database (containerized with Docker)

## Tech Stack

- **Runtime:** Node.js (ESM)
- **Framework:** Express.js
- **Database:** Prisma + PostgreSQL
- **Containerization:** Docker + Docker Compose (required)
- **Auth:** JWT (access + refresh tokens)
- **Scraping:** undici + cheerio
- **Password:** bcryptjs

## Prerequisites

This project uses **Docker and Docker Compose** for all development and deployment:

- **Docker**
- **Docker Compose**

## Quick Start

Clone the repository and start the application with Docker:

```bash
# Start the entire stack (app + PostgreSQL)
docker-compose up

# In another terminal, run database migrations (first time only)
docker exec koombea_app npm run prisma:migrate

# The API will be available at http://localhost:3000
```

That's it! The application will be fully running with PostgreSQL ready to use.

## Useful Docker Commands

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v

# Rebuild image (after dependency changes)
docker-compose build --no-cache

# Run migrations manually
docker exec koombea_app npm run prisma:migrate

# Generate Prisma client
docker exec koombea_app npm run prisma:generate
```

## Production Deployment

The `Dockerfile` provides a multi-stage build optimized for production:

```bash
# Build the image
docker build -t koombea-app:latest .

# Run with PostgreSQL (requires external PostgreSQL instance)
docker run \
  -e DATABASE_URL="postgresql://user:password@postgres_host:5432/db_name" \
  -e JWT_SECRET="your-production-secret" \
  -e JWT_REFRESH_SECRET="your-production-refresh-secret" \
  -p 3000:3000 \
  koombea-app:latest
```

Or use docker-compose with environment overrides for production.

## API Endpoints

### Authentication

```bash
# Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response includes: { accessToken, refreshToken }
```

### Pages (Protected - requires Bearer token)

```bash
# Create a page (scrapes URL inline)
curl -X POST http://localhost:3000/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "url": "https://example.com"
  }'

# List user's pages (paginated)
curl -X GET "http://localhost:3000/pages?limit=20&offset=0" \
  -H "Authorization: Bearer <accessToken>"

# Get page details
curl -X GET http://localhost:3000/pages/:pageId \
  -H "Authorization: Bearer <accessToken>"

# List links from a page (paginated)
curl -X GET "http://localhost:3000/pages/:pageId/links?limit=20&offset=0" \
  -H "Authorization: Bearer <accessToken>"
```

## Project Structure

```
node-koombea-test/
├── src/
│   ├── routes/          # Route definitions
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── repositories/     # Database queries
│   ├── middlewares/      # Express middlewares
│   ├── utils/           # Utility functions
│   ├── app.mjs          # Express app setup
│   └── server.mjs       # Server entry point
├── db/
│   └── client.mjs       # Prisma client instance
├── prisma/
│   └── schema.prisma    # Database schema
├── migrations/          # Prisma migrations
├── .env.example         # Environment template
└── package.json         # Dependencies
```

## Database Schema

- **User:** id, email (unique), password, timestamps
- **Page:** id, userId (FK), url, title, linkCount, timestamps
- **Link:** id, pageId (FK), href, text, timestamps (unique on pageId + href)

## Development

```bash
# Start with file watching
npm run dev

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

## Notes

- Scraper timeout: 12 seconds per URL
- Max links per page: depends on site content
- Links are deduplicated and normalized to absolute URLs
- Pagination default limit: 20, max: 100
- JWT expires: configurable via environment

## Future Enhancements

- Async job queue (BullMQ + Redis)
- Rate limiting
- Advanced validation (Zod)
- Comprehensive testing (Jest)
- Kubernetes deployment configuration
