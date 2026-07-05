## 1. Repo-level scaffolding

- [x] 1.1 Create root `.gitignore` covering Node/pnpm artifacts (`node_modules`, `dist`) and Xcode artifacts (`*.xcuserstate`, `DerivedData`, `build/`)
- [x] 1.2 Create root `README.md` linking to `docs/` and describing the `backend/` and `frontend/` layout

## 2. Backend project init

- [x] 2.1 Generate the NestJS 11.x project in `backend/` (Node.js 22.x LTS, pnpm, TypeScript 5.7.x) via `nest new`
- [x] 2.2 Restructure `backend/src/` into `core/`, `modules/`, `common/`, `prisma/` per `docs/backend.md` §10, with `.gitkeep` placeholders in the empty `core/` and `modules/` subdirectories
- [x] 2.3 Configure ESLint 9 (flat config) and Prettier 3, matching `docs/backend.md` §2
- [x] 2.4 Add Prisma 7.x, initialize `schema.prisma` (generator + PostgreSQL datasource only, no models yet) under `src/prisma/`
- [x] 2.5 Add `ulid` dependency for future ID generation
- [x] 2.6 Implement a `HealthController` in `src/common/` exposing `GET /health`, checking the Prisma connection
- [x] 2.7 Configure `@nestjs/swagger` to serve the OpenAPI spec (even with just the health endpoint) at `/api/docs`

## 3. Backend local environment

- [x] 3.1 Write `backend/Dockerfile` (multi-stage: install deps, build, run)
- [x] 3.2 Write `backend/docker-compose.yml` running the API and a PostgreSQL 18.x service, wired via env vars
- [x] 3.3 Add `.env.example` documenting required environment variables (DB connection string, port)
- [x] 3.4 Run the initial Prisma migration against the Compose Postgres service and verify `GET /health` succeeds

## 4. Backend tests and CI

- [x] 4.1 Add a unit test for the health check logic (Jest)
- [x] 4.2 Add an e2e test (Supertest) hitting `GET /health` against a real PostgreSQL instance
- [x] 4.3 Create `.github/workflows/backend-ci.yml`: path-filtered to `backend/**`, running `pnpm install --frozen-lockfile`, lint, `tsc --noEmit`, and `pnpm test`/`pnpm test:e2e` against a PostgreSQL service container
- [x] 4.4 Verify the workflow passes on a test PR touching only `backend/`

## 5. Frontend project init

- [x] 5.1 Create the `frontend/TandemApp` Xcode project (App target `TandemApp`, macOS 14+ deployment target, Swift 6.1 language mode, SwiftUI lifecycle)
- [x] 5.2 Create the `TandemAppTests` (Swift Testing) and `TandemAppUITests` (XCTest UI) targets
- [x] 5.3 Create the folder/group structure under `TandemApp/`: `App/`, `Features/` (with empty subfolders `Workstreams/`, `Deliverables/`, `Requirements/`, `TechnicalAnalysis/`, `WorkItems/`, `Board/`, `Roadmap/`, `Admin/`), `Networking/`, `Models/`, `Common/`
- [x] 5.4 Implement a minimal `App` entry point showing a placeholder window (no navigation/features yet)
- [x] 5.5 Add SwiftLint config (`.swiftlint.yml`) at `frontend/` matching the team's style conventions

## 6. Frontend tests and CI

- [x] 6.1 Add a placeholder unit test in `TandemAppTests` (Swift Testing) to prove the test target runs
- [x] 6.2 Add a placeholder UI test in `TandemAppUITests` that launches the app and asserts the placeholder window appears
- [x] 6.3 Create `.github/workflows/frontend-ci.yml`: path-filtered to `frontend/**`, running on `macos-latest`, selecting the required Xcode version, running SwiftLint, `xcodebuild build`, and `xcodebuild test`
- [x] 6.4 Verify the workflow passes on a test PR touching only `frontend/`

## 7. Final verification

- [x] 7.1 Confirm `docker-compose up` in `backend/` boots the API and `GET /health` returns success
- [x] 7.2 Confirm the frontend app builds and launches from a clean checkout
- [x] 7.3 Confirm both CI workflows are green and correctly path-filtered (each only runs for changes in its own directory)
