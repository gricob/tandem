## Why

Tandem currently exists only as documentation (PRD, data model, backend and frontend architecture docs) — there is no runnable code yet. Before any domain capability (users, workstreams, deliverables, etc.) can be built, the repository needs the initial project scaffolding for both the backend (NestJS/TypeScript) and the frontend (SwiftUI/macOS), matching the stack and folder structure already decided in `docs/backend.md` and `docs/frontend.md`, plus the CI pipelines that will guard every subsequent change.

## What Changes

- Initialize the `backend/` NestJS project (TypeScript, pnpm, ESLint + Prettier, Jest) with the folder structure from `docs/backend.md` §10 (`src/core/`, `src/modules/`, `src/common/`, `src/prisma/`), an initial empty Prisma schema wired to PostgreSQL, and a health-check endpoint to prove the app boots.
- Add `backend/docker-compose.yml` and `backend/Dockerfile` to run the API and a PostgreSQL instance locally.
- Initialize the `frontend/TandemApp` macOS SwiftUI app project (Xcode project/workspace, Swift 6.1, macOS 14+ deployment target) with the folder structure from `docs/frontend.md` §8 (`App/`, `Features/`, `Networking/`, `Models/`, `Common/`) and SwiftLint configured, showing a minimal placeholder window to prove the app builds and launches.
- Add `.github/workflows/backend-ci.yml` (lint, typecheck, unit + e2e tests against a Postgres service container) and `.github/workflows/frontend-ci.yml` (SwiftLint, build, unit/UI tests via `xcodebuild`), matching `docs/backend.md` §9 and `docs/frontend.md` §7.
- Add root-level repo scaffolding: top-level `README.md` pointing to `docs/` and to each project, `.gitignore` covering both Node and Xcode build artifacts.
- No domain logic, no API endpoints beyond a health check, no real UI screens — this change only establishes buildable, testable, CI-covered skeletons that later changes will fill in.

## Capabilities

### New Capabilities
- `backend-scaffolding`: initial NestJS project structure, tooling (pnpm/ESLint/Prettier/Jest), Prisma/PostgreSQL wiring, Docker Compose setup, and backend CI pipeline.
- `frontend-scaffolding`: initial SwiftUI macOS app project structure, tooling (SwiftLint), and frontend CI pipeline.

### Modified Capabilities
(none — this is the first change in the repository)

## Impact

- Affected code: new `backend/` and `frontend/` directories, new `.github/workflows/` files, new root `README.md` and `.gitignore`.
- Affected systems: GitHub Actions (two new CI workflows), local developer environment (Docker Compose, pnpm, Xcode).
- Dependencies introduced: NestJS 11.x, Prisma 7.x, PostgreSQL 18.x, pnpm 11.x on the backend; swift-openapi-generator/runtime/urlsession and SwiftLint on the frontend (all versions per `docs/backend.md` and `docs/frontend.md`).
- No impact on existing specs (none exist yet) and no runtime behavior for end users — this is pure project setup.
