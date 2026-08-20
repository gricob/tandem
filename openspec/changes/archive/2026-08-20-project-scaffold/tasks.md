## 1. Workspace root

- [x] 1.1 Add `pnpm-workspace.yaml` listing `backend` and `frontend` packages
- [x] 1.2 Add root `package.json` (name, private: true, shared scripts if any)
- [x] 1.3 Add root `.gitignore` covering `node_modules`, build outputs, `.env`, editor/OS files
- [x] 1.4 Add root `README.md` with prerequisites and setup/run instructions for both apps and `docker compose up`

## 2. Local Postgres via Docker Compose

- [x] 2.1 Add root `docker-compose.yml` with a PostgreSQL 18.x service, named volume, and exposed port matching what `backend/.env.example` will document
- [x] 2.2 Verify `docker compose up -d` starts Postgres and it's reachable with `psql`/a connection string

## 3. Backend scaffold

- [x] 3.1 Generate a NestJS 11.x app in `backend/` (TypeScript 6.0.x, Node 24.x engines field) via Nest CLI, matching the folder layout in docs/backend.md §9 (`src/modules/`, `src/common/`, `src/prisma/`)
- [x] 3.2 Add Prisma 7.x, initialize `backend/prisma/schema.prisma` with `datasource`/`generator` blocks only (no models yet), pointed at the Docker Compose Postgres via `DATABASE_URL`
- [x] 3.3 Add `backend/.env.example` documenting `DATABASE_URL`, `APP_PASSWORD`, `APP_JWT_SECRET` placeholders (values, not real secrets)
- [x] 3.4 Configure ESLint 10 (flat config) + Prettier 3 for the backend, matching docs/backend.md §2
- [x] 3.5 Add `ulid`, `class-validator`, `class-transformer` as dependencies (used by future domain modules; no usage yet)
- [x] 3.6 Wire up `@nestjs/swagger` so the app serves an OpenAPI JSON document (e.g. at `/api-json`) reflecting current routes
- [x] 3.7 Add a minimal health-check route (e.g. `GET /api/v1/health`) so the app has at least one real endpoint to boot and document
- [x] 3.8 Configure Jest (unit) and Supertest (e2e) test runners with one passing smoke test each
- [x] 3.9 Add `backend/Dockerfile` for a containerized production build
- [x] 3.10 Verify `pnpm --filter backend start:dev` boots the app and connects to the Docker Compose database

## 4. Frontend scaffold

- [x] 4.1 Generate a React 19.x + Vite 7.x app in `frontend/` (TypeScript 6.0.x) matching the folder layout in docs/frontend.md §8 (`src/app/`, `src/features/`, `src/api/`, `src/components/`, `src/lib/`)
- [x] 4.2 Install and configure TanStack Router (typed routes) and TanStack Query, wired into `src/app/` providers
- [x] 4.3 Install and configure Mantine 8.x (theme provider, light/dark color scheme) in `src/app/`
- [x] 4.4 Install `@mantine/form`, `zod`, and `mantine-form-zod-resolver`
- [x] 4.5 Configure ESLint 10 (flat config) + Prettier 3 for the frontend, matching docs/frontend.md §2
- [x] 4.6 Add `openapi-typescript` as a dev dependency with a script (e.g. `pnpm --filter frontend generate:api`) that regenerates `src/api/` types from the backend's OpenAPI document
- [x] 4.7 Configure Vitest + React Testing Library with one passing smoke test
- [x] 4.8 Configure Playwright with one passing smoke e2e test against the built app
- [x] 4.9 Verify `pnpm --filter frontend build` produces a static build with no errors

## 5. API client codegen end-to-end

- [x] 5.1 With the backend running locally, run the frontend's `generate:api` script and confirm it produces typed output with no manual edits needed
- [x] 5.2 Commit the generated client as the initial baseline (documented as generated, not hand-edited)

## 6. CI pipelines

- [x] 6.1 Add `.github/workflows/backend-ci.yml`: checkout, Node 24.x + pnpm cache setup, `pnpm install --frozen-lockfile`, lint, `tsc --noEmit`, `pnpm test`/`pnpm test:e2e` against a Postgres 18.x `services:` container; path-filtered to `backend/**`
- [x] 6.2 Add `.github/workflows/frontend-ci.yml`: checkout, Node 24.x + pnpm cache setup, `pnpm install --frozen-lockfile`, lint, `tsc --noEmit`, `pnpm test`, `pnpm build`, `pnpm test:e2e` (Playwright against the built app); path-filtered to `frontend/**`
- [x] 6.3 Push a throwaway branch touching only `backend/` and confirm only the backend workflow runs; repeat for `frontend/`
- [x] 6.4 Confirm both workflows fail correctly when a lint or type error is deliberately introduced (then revert the deliberate error)

## 7. Final verification

- [x] 7.1 From a clean clone, run `pnpm install`, `docker compose up -d`, backend start, frontend build — confirm the full loop works end-to-end per the root README
- [x] 7.2 Confirm no domain modules, auth logic, or CD steps were introduced (out of scope per proposal.md)
