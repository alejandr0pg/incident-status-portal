# Incident & Status Portal

A production-ready platform for managing service incidents, built with NestJS, Next.js, PostgreSQL, and AWS ECS/Fargate.

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Cloudflare Worker                                         │
│  Proxies /public/status → AWS ALB, caches 60s             │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│  Next.js (Vercel / Amplify)                                │
│  /login · /dashboard/incidents · /dashboard/audit          │
└──────────────────────┬─────────────────────────────────────┘
                       │ REST
┌──────────────────────▼─────────────────────────────────────┐
│  AWS — VPC                                                 │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │   ALB    │───▶│  ECS Fargate     │───▶│  RDS Postgres│  │
│  │ (public) │    │  NestJS container│    │  (private)   │  │
│  └──────────┘    └──────────────────┘    └──────────────┘  │
│                          │                                 │
│                  ┌───────▼────────┐                        │
│                  │  CloudWatch    │                        │
│                  │  Logs + Alarms │                        │
│                  └────────────────┘                        │
└────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
/
├── backend/          # NestJS API (DDD + Clean Architecture)
├── frontend/         # Next.js 15 dashboard
├── infra/            # AWS CDK (TypeScript)
├── workers/          # Cloudflare Workers
└── README.md
```

## Database: Local vs Production

| Environment | Database | How |
|-------------|----------|-----|
| **Local development** | PostgreSQL in Docker | `docker compose up -d db` — no AWS account needed |
| **Staging / Production** | RDS Aurora Serverless v2 (PostgreSQL 15) | Provisioned by CDK in `infra/lib/rds-stack.ts`, private subnet, auto-scaling 0.5–4 ACUs |

Docker is **only** used locally to mirror the RDS setup without requiring AWS access. The application code and Prisma schema are identical in both environments — only the `DATABASE_URL` differs. In production, the connection string is injected from AWS Secrets Manager into the ECS task at runtime.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- AWS CLI (for infra deployment)
- Wrangler CLI (for Cloudflare Worker)

### Local Development

```bash
# Start local PostgreSQL (mirrors RDS schema — no AWS account needed)
docker compose up -d db

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

### Environment Variables

#### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/incidents
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```

#### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/login | No | Login with email/password |
| POST | /auth/logout | Yes | Logout (clears cookie) |
| GET | /auth/me | Yes | Get current user |
| POST | /incidents | Yes | Create incident |
| GET | /incidents | Yes | List incidents (filterable) |
| GET | /incidents/:id | Yes | Get incident details |
| PUT | /incidents/:id | Yes | Update incident |
| DELETE | /incidents/:id | Yes (admin) | Delete incident |
| GET | /audit | Yes | List audit logs |
| GET | /public/status | No | Public system status |

## Deployment

### Backend (AWS ECS/Fargate)

```bash
cd infra
npm install
npm run cdk bootstrap
npm run cdk deploy --all
```

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

### Cloudflare Worker

```bash
cd workers/status-cache
wrangler deploy
```

## Technology Choices

- **ECS/Fargate over Lambda**: NestJS runs better as a long-lived process; no cold start concerns
- **Prisma over TypeORM**: Better migration story, type-safe queries, cleaner schema definition
- **Cookie-based JWT**: HttpOnly cookie prevents XSS token theft vs localStorage
- **Serverless v2 RDS**: Cost-effective for test/staging, scales to zero
- **Cloudflare Worker**: Handles public endpoint caching at edge without Redis
