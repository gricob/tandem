## Context

`Deliverable` (backend/src/prisma/schema.prisma, `deliverables` table) is currently a flat, standalone model (`id`, `name`, `description`, timestamps) with no parent. It already has a rich child structure of its own: `UserStory` (extends `Form`, `deliverableId` + `order_index`) and, under each user story, `AcceptanceCriterion` (same shape). Both are nested resources reached through `/deliverables/:deliverableId/...` routes, and `GET /deliverables`/`GET /deliverables/:deliverableId` embed the full tree.

The codebase has two existing nested-child patterns to draw from:
- `FormTemplate` → `FormTemplateField`: the child is a genuine standalone entity (not an extension of anything), with full nested CRUD under the parent (`POST/PATCH/DELETE .../fields/:fieldId`, plus `PUT .../fields/order`) — see `backend/src/modules/form-templates/form-templates.controller.ts`.
- `Deliverable` → `UserStory`: the child *is* a `Form` (shared-PK inheritance), so it reuses `Form`'s own top-level edit endpoint rather than getting its own nested edit route; only create/delete/reorder are nested.

`Workstream` → `Deliverable` is the first case, not the second: `Deliverable` is a genuine standalone entity with its own fields and its own further children (`UserStory`), not an extension of anything. So it should follow the `FormTemplateField` shape for creation/reorder — but naively re-nesting *every* deliverable route under `/workstreams/:workstreamId/...` would force `/deliverables/:deliverableId/user-stories/...` to become a three-level path (`/workstreams/:workstreamId/deliverables/:deliverableId/user-stories/...`), rippling into a feature this change has no reason to touch.

## Goals / Non-Goals

**Goals:**
- Every `Deliverable` belongs to exactly one `Workstream` (required, not nullable), ordered within it via `order_index`, mirroring how `UserStory` belongs to `Deliverable`.
- `Workstream` gets full standalone CRUD (create, list, view, edit, delete), matching `Deliverable`'s original shape before this change.
- Minimize disruption to the already-built `UserStory`/`AcceptanceCriterion` feature: none of their routes, controllers, or tests change.

**Non-Goals:**
- No change to `UserStory`, `AcceptanceCriterion`, `Form`, or `FormTemplate` schemas or endpoints.
- No moving a `Deliverable` between workstreams in this change (no `PATCH` of `workstreamId`) — only set at creation. Can be added later if needed.
- No workstream-level ordering/nesting beyond one level (no "workstream of workstreams").

## Decisions

- **`Deliverable.id` stays the addressing key for everything below it.** `GET /deliverables/:deliverableId`, `PATCH /deliverables/:deliverableId`, `DELETE /deliverables/:deliverableId`, and all `/deliverables/:deliverableId/user-stories/...` routes are unchanged — same controller, same paths. Only the operations that inherently need the *parent* in scope move to nested routes:
  - **Create** needs the workstream to assign `workstreamId` and compute the next `order_index` → `POST /workstreams/:workstreamId/deliverables`.
  - **Reorder** operates on the full set of a workstream's deliverables → `PUT /workstreams/:workstreamId/deliverables/order`.
  - Alternative considered: fully nest every deliverable route under `/workstreams/:workstreamId/deliverables/:deliverableId/...` (matching `FormTemplateField` exactly). Rejected — `deliverableId` is already a globally unique ULID, so the extra path segment adds no addressing value, and it would force churn onto the unrelated, already-shipped user-stories/acceptance-criteria routes and their tests.
- **Flat `GET /deliverables` (list-all) is removed, not kept alongside the new workstream-scoped listing.** Deliverables are now conceptually owned by a workstream, so browsing them flows through `GET /workstreams` (list, each embedding its deliverables) and `GET /workstreams/:workstreamId` (single, same embed) — both sorted by `order_index`, each deliverable still embedding its `userStories` exactly as before. Keeping a separate flat "all deliverables regardless of workstream" list would duplicate the workstream listing with no clear use case.
  - Alternative considered: keep `GET /deliverables` as-is for convenience. Rejected to avoid two divergent ways to list the same data with no current consumer for the flat one; can be reintroduced later if a real need shows up.
- **`POST /api/v1/deliverables` (flat create) is removed** in favor of `POST /workstreams/:workstreamId/deliverables`, since creation without a workstream is no longer valid (workstreamId is required, not nullable).
- **`Workstream` deletion cascades through its deliverables using the existing per-deliverable cascade, not a new bulk implementation.** `DeliverablesService` already knows how to delete one deliverable and everything beneath it (user stories → their acceptance criteria → the forms backing both, bottom-up, see the `deliverable-user-stories` design). `WorkstreamsService.deleteWorkstream` runs that same per-deliverable logic for every deliverable in the workstream, all inside one transaction, rather than duplicating the bottom-up deletion logic against `workstreamId` directly.
  - Alternative considered: let a plain DB cascade (`onDelete: Cascade` from `Workstream` → `Deliverable`) handle it. Rejected for the same reason it was rejected one level down: cascade only removes wrapper rows (`Deliverable`, `UserStory`, `AcceptanceCriterion`), never the underlying `Form` rows for user stories/acceptance criteria, which would otherwise be orphaned.
- **New `WorkstreamsModule`** (controller, service, DTOs) depends on `DeliverablesModule` (imports `DeliverablesService`) for the create/cascade-delete/response-embedding logic, the same way `UserStoriesModule` depends on `FormsModule` today. `DeliverablesController`/`DeliverablesService` lose their flat `create`/`findAll` handlers (moved to `WorkstreamsController`/`WorkstreamsService`) but keep `get`/`update`/`delete` by id, plus gain an internal `createDeliverableForWorkstream`/reorder method called from `WorkstreamsService`.
- **Frontend**: `workstreams` becomes the new primary nav entry and top-level list/create/delete screen; a workstream detail screen lists its deliverables (add by name/description, drag-and-drop reorder via `@dnd-kit` — same pattern as the existing user-story list, remove), and each deliverable links to its existing, unchanged edit page (`/deliverables/$deliverableId`) for managing user stories/acceptance criteria. The old flat deliverables list page/route is deleted.

## Risks / Trade-offs

- [Removing `GET /deliverables` and `POST /deliverables` is a breaking API change] → Acceptable: this app has no external API consumers (shared-password-protected internal tool), and the frontend is updated in the same change.
- [Splitting deliverable creation/reorder into `WorkstreamsModule` while get/update/delete stay in `DeliverablesModule` spreads deliverable logic across two modules] → Mirrors the existing `UserStoriesModule` ↔ `FormsModule` split (create composes into a shared service from another module); scoped to a small, well-named cross-module dependency (`WorkstreamsModule` importing `DeliverablesModule`), not a circular one.
- [Deleting a workstream with many deliverables, each with many user stories/acceptance criteria, does more DB work per request than the current per-deliverable delete] → Same shape of risk already accepted for deleting a single deliverable; still done in one transaction, so it's atomic even if slower under heavy nesting.
