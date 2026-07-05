## Context

The repository currently contains only planning docs (`docs/prd.md`, `docs/modelo-datos.md`, `docs/backend.md`, `docs/frontend.md`) and OpenSpec metadata — no `backend/` or `frontend/` code exists yet. `docs/backend.md` and `docs/frontend.md` already fix the stack, folder layout, and CI approach; this design does not re-decide those, it only works out the concrete steps and ordering to stand up two independent, buildable, CI-covered project skeletons that later domain changes will build on.

## Goals / Non-Goals

**Goals:**
- Stand up `backend/` as a running NestJS app (boots, exposes a health check, connects to PostgreSQL via Prisma) with the exact folder structure from `docs/backend.md` §10.
- Stand up `frontend/TandemApp` as a buildable, launchable SwiftUI macOS app with the exact folder structure from `docs/frontend.md` §8.
- Wire up `backend-ci.yml` and `frontend-ci.yml` so every subsequent PR is validated automatically from day one.
- Keep the two projects fully independent: nothing in this change requires the backend and frontend to be developed or deployed together.

**Non-Goals:**
- No domain entities, business rules, or API endpoints beyond a health check (no Workstream/Deliverable/WorkItem code).
- No real UI screens/navigation beyond a placeholder window proving the app launches.
- No authentication implementation (JWT/Keychain wiring is a future change, once `AuthModule`/`SessionStore` have actual behavior to protect).
- No hosting/deployment decision or CD pipeline — `docs/backend.md` §11 explicitly defers this.
- No OpenAPI-generated Swift client yet — there is no real API surface for it to describe.

## Decisions

- **Empty `core/` vs `modules/` directories are created with `.gitkeep` placeholders, not stub modules.** Creating fake `DeliverablesModule`/`WorkstreamsModule` shells with no behavior would just be code to delete later. The folder structure from `docs/backend.md` §10 is established as empty directories so the convention is visible and the first domain change drops code straight into the right place.
  - Alternative considered: scaffold each module with a NestJS-generated empty controller/service. Rejected — adds boilerplate with no behavior and no test value now.
- **A single `/health` endpoint (in `src/common/`) is the only controller in this change.** It's the minimum needed to prove the app boots, connects its dependencies, and that CI's e2e test stage has something real to exercise.
- **Prisma schema starts empty (just the `generator`/`datasource` blocks) with one initial migration.** This proves the Postgres connection and migration workflow end-to-end without inventing placeholder tables that don't match `docs/modelo-datos.md` until a real domain change defines them.
- **Backend and frontend CI are two independent workflows, each path-filtered to its own directory (`backend/**`, `frontend/**`).** Matches `docs/backend.md` §9 / `docs/frontend.md` §7 and avoids running a `macos-latest` Xcode build on backend-only PRs (and vice versa) — meaningful cost/time savings given `macos-latest` runners are slower to schedule and billed at a higher multiplier than Linux runners.
- **Frontend project uses a plain Xcode project (`.xcodeproj`), not a Swift Package as the app target.** SwiftUI macOS apps with entitlements/signing/notarization (per `docs/frontend.md` §2 distribution) are conventionally Xcode project-based; SPM is still usable for internal modules later if needed, but isn't required for this skeleton.
- **No Docker image build/push in this change.** `docs/backend.md` §9 places image build/push "on main branch" as a CD precursor once hosting is decided; building it now with nowhere to push it would be dead CI time.

## Risks / Trade-offs

- [Empty Prisma schema / no domain tables] → First domain change (e.g. Users or Workstreams) will need to add the first real migration; acceptable since that's the natural place for schema to start living.
- [Xcode project generation is manual/GUI-oriented, harder to script than `nest new`] → Document exact Xcode version, project settings (deployment target, bundle ID, Swift 6 language mode) in tasks.md so the steps are reproducible even without a project generator CLI.
- [Two independent CI workflows mean two places to keep Node/Xcode versions current] → Both already documented centrally in `docs/backend.md` / `docs/frontend.md`; workflows should read versions from those docs whenever bumped, per the existing "explicit change" rule for stack updates.
- [`macos-latest` GitHub-hosted runners have historically had slower queue times and stricter concurrency limits than Linux runners] → Acceptable for now given low PR volume at this stage; revisit (e.g. self-hosted runner) if frontend CI becomes a bottleneck.

## Open Questions

- None blocking — hosting/CD, OpenAPI client generation, and auth wiring are explicitly deferred to future changes per `docs/backend.md` §11 and `docs/frontend.md` §9.
