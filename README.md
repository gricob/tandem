# Tandem

Create configurable forms, share them, and review the responses you receive. See [docs/prd.md](docs/prd.md) for the product spec, and [docs/backend.md](docs/backend.md) / [docs/frontend.md](docs/frontend.md) for the architecture and stack.

This repo is a pnpm workspace with two packages:

- [`backend/`](backend/) - NestJS 11 + Prisma 7 API (TypeScript)
- [`frontend/`](frontend/) - React 19 + Vite 7 SPA (TypeScript)

## Prerequisites

- Node.js 24.x
- pnpm 11.x (`corepack enable` will pick up the version pinned in `package.json`)
- Docker (for the local PostgreSQL database)

## Setup

```bash
pnpm install
docker compose up -d          # starts PostgreSQL 18 on localhost:5432
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
pnpm --filter backend prisma:generate
```

## Running locally

In one terminal:

```bash
pnpm --filter backend start:dev   # http://localhost:3000
```

In another terminal:

```bash
pnpm --filter frontend dev        # http://localhost:5173
```

With the backend running, you can regenerate the frontend's typed API client from its OpenAPI document at any time:

```bash
pnpm --filter frontend generate:api
```

## Tests and checks

```bash
pnpm --filter backend lint && pnpm --filter backend typecheck && pnpm --filter backend test && pnpm --filter backend test:e2e
pnpm --filter frontend lint && pnpm --filter frontend typecheck && pnpm --filter frontend test && pnpm --filter frontend test:e2e
```

CI (GitHub Actions) runs the same checks per package, path-scoped to `backend/**` and `frontend/**` respectively - see `.github/workflows/`.

## Project status

This is the initial project scaffold: both apps boot, are wired together (OpenAPI contract, typed API client), and have working lint/typecheck/test/build pipelines locally and in CI. No domain features (form types, forms, responses) or the shared-password auth flow exist yet - those land in their own changes.
