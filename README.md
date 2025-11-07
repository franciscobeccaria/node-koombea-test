# Koombea Technical Test - Web Scraper API

A production-ready Node.js REST API for web scraping and user authentication. Extract links and page titles from URLs with async processing, JWT-based authentication, and comprehensive testing.

## 🎯 Features Implemented

### Core Functionality

- ✅ **User Authentication:** Register, login, automatic token refresh (50 min interval)
- ✅ **Web Scraping:** Async job queue (BullMQ + Redis) with 12s timeout
- ✅ **Link Extraction:** HTML parsing with URL normalization & deduplication
- ✅ **Pagination:** Pages and links with limit/offset support
- ✅ **Real-time Updates:** Dashboard auto-refreshes when pages are processing
- ✅ **Error Handling:** Comprehensive error middleware with proper HTTP status codes

### Backend

- ✅ Express.js REST API (controller → service → repository pattern)
- ✅ Prisma ORM with PostgreSQL & database migrations
- ✅ Health check endpoint for monitoring
- ✅ Graceful shutdown with SIGTERM handling
- ✅ CORS configuration (inline in app.mjs, dev + prod ready)

### Frontend

- ✅ Authentication UI (register/login)
- ✅ Dashboard with paginated pages list and real-time status badges
- ✅ Page details view with links list
- ✅ Error messages and user feedback
- ✅ Responsive CSS styling

### DevOps & Infrastructure

- ✅ Docker multi-stage build (production-optimized)
- ✅ Docker Compose (PostgreSQL + Redis + App)
- ✅ Persistent volumes & health checks
- ✅ Non-root user in container

### Testing & Quality

- ✅ Jest test suite
- ✅ Unit tests (services, repositories, controllers)
- ✅ Integration tests (API, database)

### Security Features

- ✅ JWT with strong secrets + short-lived access tokens (1h), httpOnly cookies
- ✅ Password Hashing - bcryptjs (10 rounds), never returned in responses
- ✅ Rate Limiting - 100 req/min (auth), 20 req/min (pages)
- ✅ Data Isolation - Users only access their own pages
- ✅ CORS & Cascade Delete - Configurable origins, automatic cleanup on user deletion

## 📊 Technology Stack & Dependencies

| Category             | Technology                            | Version                  | Purpose                            |
| -------------------- | ------------------------------------- | ------------------------ | ---------------------------------- |
| **Runtime**          | Node.js                               | 20.x                     | JavaScript runtime (ESM modules)   |
| **Framework**        | Express.js                            | ^4.18.2                  | HTTP server & routing              |
| **ORM**              | Prisma                                | ^5.7.0                   | Database queries & migrations      |
| **Database**         | PostgreSQL                            | 15-alpine                | Primary database (Docker)          |
| **Cache/Queue**      | Redis + BullMQ                        | 7-alpine, ^5.63.0        | Job queue & async processing       |
| **HTTP Client**      | undici                                | ^6.10.1                  | Node.js native HTTP client         |
| **HTML Parser**      | cheerio                               | ^1.0.0-rc.12             | DOM manipulation & link extraction |
| **Auth & Security**  | jsonwebtoken, bcryptjs, cookie-parser | ^8.5.1, ^2.4.3, ^1.4.7   | JWT, password hashing, cookies     |
| **Rate Limiting**    | express-rate-limit                    | ^8.2.1                   | Request throttling                 |
| **Redis Client**     | ioredis                               | ^5.8.2                   | Redis connection pooling           |
| **Testing**          | Jest, Supertest, Testcontainers       | ^29.7.0, ^7.1.4, ^11.8.0 | Tests & Docker management          |
| **Environment**      | dotenv                                | ^16.3.1                  | Environment variables              |
| **Containerization** | Docker + Compose                      | Latest                   | Container runtime & orchestration  |

## 🚀 Quick Start

### Run with Docker

```bash
# 1. Clone and setup
git clone <repo-url>
cd node-koombea-test
cp .env.example .env

# 2. Start all services
docker-compose up

# 3. Run migrations (first time only, in another terminal)
docker exec koombea_app npm run prisma:migrate

# 4. Access the application
# Frontend: http://localhost:3000
# API: http://localhost:3000/auth, /pages, etc.
```

## 📚 API Endpoints

### Authentication

- `POST /auth/register` - Register new user (username, password)
- `POST /auth/login` - Login user (username, password)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (clear cookies)

### Pages (Protected - Requires JWT)

- `POST /pages` - Create and scrape URL (url)
- `GET /pages?limit=20&offset=0` - List user's pages (paginated)
- `GET /pages/:id` - Get page details
- `GET /pages/:id/links?limit=20&offset=0` - List page links (paginated)
- `GET /pages/:id/scrape-status` - Get scraping job status

### Frontend Pages

- `GET /` - Authentication & Dashboard page (index.html)
- `GET /page/:id` - Page details view (pages.html)

### Health

- `GET /health` - Health check endpoint

**Rate Limits:** Auth (100 req/min), Pages (20 req/min)

## 🏗️ Architecture

### Request Flow

```
Client Request
    ↓
Express Middleware (CORS, Rate Limit, Auth Guard)
    ↓
Controller (Request validation, call service)
    ↓
Service (Business logic, call repository)
    ↓
Repository (Database queries via Prisma)
    ↓
PostgreSQL Database ↔ Response JSON
```

### Web Scraping Flow

```
POST /pages (URL submitted)
    ↓
Create Page record (status: "processing")
    ↓
Enqueue Job to Redis (BullMQ)
    ↓
Return 202 Accepted immediately
    ↓
[ASYNC] Fetch URL with 12s timeout
    ↓
Parse HTML → Extract <a> tags → Normalize URLs
    ↓
Deduplicate → Store links in DB (unique constraint)
    ↓
Update Page title and status: "completed"
```

### Authentication Flow

```
Register/Login
    ↓
Hash password (bcryptjs)
    ↓
Generate tokens (accessToken: 1h, refreshToken: 7d)
    ↓
Set httpOnly cookies (secure, sameSite: strict)
    ↓
Frontend: Proactive refresh every 50 minutes
    ↓
On 401: Reactive refresh with /auth/refresh
```

## 📂 Project Structure

```
node-koombea-test/
├── src/
│   ├── app.mjs                      # Express app setup & middleware (includes CORS)
│   ├── server.mjs                   # Entry point & graceful shutdown
│   ├── controllers/                 # Request handlers
│   ├── services/                    # Business logic
│   ├── repositories/                # Database queries
│   ├── middlewares/                 # Auth guard, error, rate limit
│   ├── routes/                      # Route definitions
│   ├── utils/                       # Scraper utility, env validator
│   └── queue/                       # BullMQ worker setup
├── db/
│   └── client.mjs                   # Prisma client instance
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── migrations/                  # Database migrations
├── public/                          # Frontend (HTML, JS, CSS)
├── __tests__/                       # Test suite (unit + integration)
├── docker-compose.yml               # Multi-container orchestration
├── Dockerfile                       # Production-ready image
├── .env.example                     # Environment template
├── jest.config.mjs                  # Jest configuration
├── jest.setup.mjs                   # Jest setup
├── package.json                     # Dependencies & scripts
└── README.md
```

## 💾 Database Schema

### User

```
id (PK) | username (UNIQUE) | password | createdAt | updatedAt
```

### Page

```
id (PK) | userId (FK) | url | title | linkCount | status | createdAt | updatedAt
Indexes: userId
Status: "processing" | "completed" | "failed"
```

### Link

```
id (PK) | pageId (FK) | href | text | createdAt
Unique: (pageId, href) - Deduplication constraint
Indexes: pageId
```

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- auth.service.test.mjs
```

**Test Files Location:** `__tests__/unit/` and `__tests__/integration/`

## 📋 Environment Configuration

Create `.env` file in project root:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/koombea_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (use strong random strings in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Production Deployment

Build and run the Docker image:

```bash
# Build
docker build -t koombea-scraper:1.0.0 .

# Run with environment variables
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@postgres:5432/koombea_prod" \
  -e JWT_SECRET="$(openssl rand -base64 32)" \
  -e JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
  koombea-scraper:1.0.0

# Health check
curl http://localhost:3000/health
```

Or use Docker Compose with production environment variables.
