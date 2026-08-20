## Context

The repo currently contains only `docs/` (PRD, data model, backend and frontend architecture docs) — no `backend/`, `frontend/`, or CI exists yet. `docs/backend.md` and `docs/frontend.md` already fix the stack and folder layout in detail; this design is about *how to lay down that skeleton correctly* so every subsequent change (starting with the `FormType`/`FormField`/`Form`/`FormResponse` CRUD modules) can build on it without re-litigating tooling choices.

## Goals / Non-Goals

**Goals:**
- A pnpm-workspace monorepo with `backend/` (NestJS) and `frontend/` (React/Vite) that both build, lint, and run their (empty) test suites successfully from a clean checkout.
- Local dev loop: `docker compose up` gives a Postgres instance the backend can migrate against; both apps run with a single install + start command each.
- CI (GitHub Actions) enforces lint/typecheck/test on every PR touching each app, mirroring `docs/backend.md` §8 and `docs/frontend.md` §7 exactly.
- Backend exposes a live (near-empty) OpenAPI document from boot, so the frontend's `openapi-typescript` codegen script has something real to point at.

**Non-Goals:**
- No domain modules, entities, or endpoints (`FormType`, `FormField`, `Form`, `FormResponse`) — those are future changes built on top of this scaffold.
- No shared-password/JWT auth flow implementation — the scaffold just leaves the seam (`AuthGuard`, `auth` feature folder) where it will go.
- No CD / hosting — both CI workflows stop at build/test; deploy steps are deferred to the hosting-decision change (`docs/backend.md` §10, `docs/frontend.md` §9).
- No production Postgres provisioning — `docker-compose.yml` is for local development only.

## Decisions

- **pnpm workspace at the repo root** (`pnpm-workspace.yaml` listing `backend` and `frontend`), rather than two unrelated repos or npm/yarn workspaces. Both docs already pin pnpm as the package manager and note it "facilita un futuro monorepo con `pnpm workspaces`" (docs/frontend.md §2) — this makes that future the present, avoids duplicating root tooling config, and matches how both CI workflows are scoped by path.
- **Folder layout exactly as proposed in the docs** (`backend/src/modules/`, `backend/src/common/`, `backend/prisma/`; `frontend/src/app|features|api|components|lib`) even though most of those folders start empty (e.g. `modules/` has no domain module yet). Deviating now would just create churn when the first domain change lands.
- **Backend boots with zero domain modules but a real Prisma schema file** (`backend/prisma/schema.prisma` with just the Prisma generator/datasource blocks, no models yet). This lets `prisma migrate dev` run in CI/local from day one instead of being introduced awkwardly alongside the first entity.
- **OpenAPI document is generated from an empty (or near-empty, e.g. a `/health` route) controller set.** The frontend's codegen script (`openapi-typescript`) is wired up and run against it in this change, producing a mostly-empty generated client. This proves the backend-to-frontend type pipeline end-to-end before any real endpoint exists, which is cheaper to debug now than once real routes are involved.
- **`docker-compose.yml` at the repo root, not under `backend/`.** It only defines the Postgres service the backend depends on for local dev; keeping it at the root matches where a developer runs `docker compose up` before touching either app, and leaves room for a future frontend or other service to join the same compose file without relocating it.
- **CI workflows are path-filtered per app** (`paths: ['backend/**']` / `['frontend/**']`) as specified in the docs, so unrelated app changes don't trigger irrelevant pipelines — kept from day one so future PRs already get correctly scoped CI rather than needing a follow-up change to add filtering.
- **Version pinning**: use exactly the versions fixed in docs/backend.md §2 and docs/frontend.md §2 (Node 24.x, NestJS 11.x, Prisma 7.x, Postgres 18.x, React 19.x, Vite 7.x, Mantine 8.x, etc.). If any pinned version isn't actually installable at implementation time (e.g. not yet released), that's a stack decision change and should go through its own openspec change to update the docs — not a silent downgrade inside this scaffold.

## Risks / Trade-offs

- [Some pinned major versions (Node 24, NestJS 11, Prisma 7, React 19, Mantine 8, TanStack Router 1.x) may not be installable exactly as specified when tasks are executed] → Treat as a blocking discrepancy: stop and flag it rather than silently substituting a version; the docs are the source of truth and get updated via their own change if a pin turns out to be wrong.
- [Scaffolding a lot of empty structure (modules/, features/ folders with nothing in them) risks looking like premature abstraction] → Justified here specifically because the target structure is already explicitly specified in committed docs, not invented; deviating would cost more (a later restructuring change) than it saves.
- [Docker Compose Postgres version drifting from what CI's `services:` Postgres uses] → Pin both to Postgres 18.x explicitly in `docker-compose.yml` and in the CI workflow's `services:` block.

## Migration Plan

Not applicable — this is the first code in the repository, no existing system to migrate from or roll back to. If the scaffold needs rework after landing, it's a normal follow-up change.

## Open Questions

- None blocking. Hosting/infra provider remains an explicit open decision per the docs, deferred to its own future change.
