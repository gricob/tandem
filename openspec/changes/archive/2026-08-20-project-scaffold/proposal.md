## Why

Tandem currently has only product/architecture docs (`docs/prd.md`, `docs/backend.md`, `docs/frontend.md`, `docs/modelo-datos.md`) — no code exists yet. Every future change needs a working backend and frontend skeleton, wired to the stacks already decided in those docs, before any domain feature (form types, forms, responses) can be built. Scaffolding this now, as its own change, keeps stack setup out of the diff of the first real feature.

## What Changes

- Initialize the repo as a pnpm workspace containing `backend/` and `frontend/`.
- Scaffold `backend/`: NestJS 11 app on Node 24, TypeScript 6.0, with Prisma 7 wired to PostgreSQL 18, ESLint 10 (flat config) + Prettier 3, Jest + Supertest configured, `@nestjs/swagger` producing an OpenAPI document, empty `common/` and `prisma/` folders per the proposed structure ([docs/backend.md](../../../docs/backend.md) §9). No domain modules (`FormTypesModule`, etc.) yet — those are future changes.
- Scaffold `frontend/`: React 19 + Vite 7 SPA in TypeScript 6.0, TanStack Router and TanStack Query installed, Mantine 8 configured (light/dark theme), `@mantine/form` + Zod available, Vitest + React Testing Library and Playwright configured, ESLint 10 + Prettier 3, empty `app/`, `features/`, `api/`, `components/`, `lib/` folders per the proposed structure ([docs/frontend.md](../../../docs/frontend.md) §8).
- Add `docker-compose.yml` at the repo root providing a local PostgreSQL 18 service for backend development.
- Add `backend/Dockerfile` for the containerized backend image.
- Add GitHub Actions workflows `.github/workflows/backend-ci.yml` and `.github/workflows/frontend-ci.yml`, path-scoped to their respective folders, running lint, typecheck, and (empty-but-passing) test suites ([docs/backend.md](../../../docs/backend.md) §8, [docs/frontend.md](../../../docs/frontend.md) §7). No CD — hosting is not yet decided.
- Add a root README with setup/run instructions for both apps.
- Generate the OpenAPI-derived TypeScript client scaffolding in the frontend (`openapi-typescript` wired into a script), even though the backend exposes no domain routes yet.

Explicitly out of scope: any domain module (`FormType`/`FormField`/`Form`/`FormResponse`), the shared-password auth flow, actual CI secrets/deploy targets, and hosting provider selection — each is its own future change.

## Capabilities

### New Capabilities
- `project-scaffold`: baseline, runnable backend and frontend skeletons (no domain logic) with local dev tooling (Docker Compose, lint/format/test wiring) and CI pipelines, matching the stacks fixed in docs/backend.md and docs/frontend.md.

### Modified Capabilities
(none — this is the first change in the repo; no existing specs to modify)

## Impact

- New directories: `backend/`, `frontend/`, `.github/workflows/`.
- New root files: `pnpm-workspace.yaml`, `docker-compose.yml`, `README.md`, root `package.json`, shared `.gitignore`.
- Dependencies: introduces the full stacks listed in docs/backend.md §2 and docs/frontend.md §2 (NestJS, Prisma, Mantine, TanStack Router/Query, etc.) at the versions fixed there.
- No impact on existing docs; `openspec/config.yaml` project context was refreshed separately to match the current (forms-only) PRD before this proposal was written.
