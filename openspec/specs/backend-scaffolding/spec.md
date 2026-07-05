# backend-scaffolding

## Purpose

TBD - defines the initial scaffolding of the Tandem backend: project structure, application bootstrapping and health check, database wiring via Prisma/PostgreSQL, local development environment, and CI pipeline.

## Requirements

### Requirement: Backend project structure
The `backend/` directory SHALL contain a NestJS 11.x application on Node.js 22.x LTS with the folder structure defined in `docs/backend.md` §10 (`src/core/`, `src/modules/`, `src/common/`, `src/prisma/`, `test/`), managed with pnpm.

#### Scenario: Folder structure matches the documented layout
- **WHEN** `backend/src/` is inspected
- **THEN** it contains the `core/`, `modules/`, `common/`, and `prisma/` directories, with `core/` and `modules/` empty except for placeholders marking where future domain and support modules will live

#### Scenario: Dependencies install with pnpm
- **WHEN** `pnpm install` is run inside `backend/`
- **THEN** it completes successfully using the committed `pnpm-lock.yaml`

### Requirement: Backend application boots and exposes a health check
The backend application SHALL start successfully and expose a health-check endpoint that confirms the process is running and connected to its PostgreSQL database.

#### Scenario: Application starts
- **WHEN** the backend is started (locally or via `docker-compose up`)
- **THEN** the NestJS application boots without errors and begins listening for HTTP requests

#### Scenario: Health check succeeds
- **WHEN** a client sends `GET /health`
- **THEN** the API responds with a success status confirming the application and its database connection are healthy

### Requirement: Database wiring via Prisma and PostgreSQL
The backend SHALL use Prisma as its ORM against a PostgreSQL 18.x database, with an initial schema and migration that establish the connection without yet defining domain tables.

#### Scenario: Initial migration applies cleanly
- **WHEN** `prisma migrate deploy` (or `migrate dev`) is run against a fresh PostgreSQL database
- **THEN** the initial migration applies without errors, leaving the database ready for future domain migrations

### Requirement: Local development environment via Docker Compose
The backend SHALL provide a `docker-compose.yml` that runs the API and a PostgreSQL instance together for local development.

#### Scenario: Local stack starts with one command
- **WHEN** a developer runs `docker-compose up` in `backend/`
- **THEN** both the API container and the PostgreSQL container start, and `GET /health` succeeds against the running API

### Requirement: Backend CI pipeline
A GitHub Actions workflow SHALL validate every push and pull request that touches `backend/`, running lint, type-checking, and tests against a PostgreSQL service container.

#### Scenario: CI runs on a backend pull request
- **WHEN** a pull request modifies a file under `backend/`
- **THEN** `.github/workflows/backend-ci.yml` runs pnpm install, lint, `tsc --noEmit`, and the test suite (unit + e2e) against a PostgreSQL service container, and reports a single pass/fail status

#### Scenario: CI is skipped for unrelated changes
- **WHEN** a pull request only modifies files outside `backend/`
- **THEN** `backend-ci.yml` does not run
