# Koombea Technical Test - Web Scraper API

A Node.js REST API for web scraping and user authentication. Extract links and page titles from URLs with JWT-based authentication.

## Features

- User authentication (register/login with JWT)
- Web scraping with timeout and deduplication
- Link extraction from HTML pages
- Paginated listing of pages and links
- SQLite for local development

## Tech Stack

- **Runtime:** Node.js (ESM)
- **Framework:** Express.js
- **Database:** Prisma + SQLite
- **Auth:** JWT (access + refresh tokens)
- **Scraping:** undici + cheerio
- **Password:** bcryptjs

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone/download the repo
cd node-koombea-test

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run migrations (already done in setup)
npm run prisma:generate

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

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
- Docker support
