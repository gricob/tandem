## Why

Deliverables currently exist as a flat, ungrouped list. As the number of deliverables grows there's no way to organize them by initiative — a `Workstream` groups multiple `Deliverable`s together, giving the deliverables list a meaningful top-level structure.

## What Changes

- Add a `Workstream` model: `id`, `name` (required), `description` (optional), `created_at`, `updated_at` — a standalone top-level entity with its own CRUD, mirroring the original shape of `Deliverable`.
- **BREAKING**: `Deliverable` now requires a `workstreamId` (every deliverable must belong to exactly one workstream) and an `order_index` for its position within that workstream, mirroring how `UserStory` belongs to `Deliverable`.
- **BREAKING**: `POST /api/v1/deliverables` (flat creation) is replaced by `POST /api/v1/workstreams/:workstreamId/deliverables`.
- **BREAKING**: `GET /api/v1/deliverables` (flat list-all) is removed. Deliverables are now browsed via their workstream: `GET /api/v1/workstreams` and `GET /api/v1/workstreams/:workstreamId` each embed their deliverables, sorted by `order_index` (each deliverable still embedding its `userStories` as today, unchanged).
- Add `PUT /api/v1/workstreams/:workstreamId/deliverables/order` to reorder a workstream's deliverables, mirroring the existing user-story reorder endpoint.
- `GET /api/v1/deliverables/:deliverableId`, `PATCH /api/v1/deliverables/:deliverableId`, and `DELETE /api/v1/deliverables/:deliverableId` stay as-is (unchanged paths and behavior) since `deliverableId` is already a globally unique identifier and the existing `/deliverables/:deliverableId/user-stories/...` routes anchor to it — re-nesting them under `/workstreams/:workstreamId/...` would needlessly ripple into the user-stories/acceptance-criteria feature.
- Deleting a `Workstream` permanently deletes all of its deliverables, including the forms backing their user stories and acceptance criteria (reusing the existing per-deliverable cascade logic, applied to every deliverable in the workstream in one transaction).
- Frontend: new `workstreams` feature — a list screen (create/delete workstreams) and a detail screen listing a workstream's deliverables (add via name/description, reorder via drag-and-drop, remove), linking each deliverable to its existing edit page. This becomes the primary navigation entry point, replacing the flat deliverables list screen/route.

## Capabilities

### New Capabilities
- `workstreams`: create, list, view, edit, and delete `Workstream` records; add, reorder, and remove a workstream's deliverables (backend API + frontend screens).

### Modified Capabilities
- `deliverables`: `Deliverable` now requires a `workstreamId` and `order_index`; creation moves from `POST /api/v1/deliverables` to the nested `POST /api/v1/workstreams/:workstreamId/deliverables`; the flat list-all endpoint (`GET /api/v1/deliverables`) is removed; deleting a deliverable is unaffected but is now also triggered transitively by deleting its workstream; the frontend's standalone deliverables list screen is removed in favor of the workstream detail screen.

## Impact

- **Backend**: `backend/src/prisma/schema.prisma` (new `Workstream` model; `Deliverable` gains `workstreamId` FK with `onDelete: Cascade` and `order_index`), new migration. New `WorkstreamsModule` (controller, service, DTOs) for `/api/v1/workstreams`, depending on `DeliverablesModule`/`DeliverablesService` for cascading delete and embedding deliverables in responses. `deliverables.controller.ts`/`deliverables.service.ts` lose their flat create/list-all handlers; those move to `WorkstreamsController`. Existing `deliverables.e2e-spec.ts` and `deliverables.service.spec.ts` updated for the new required fields and removed/moved endpoints.
- **Frontend**: new `frontend/src/features/workstreams/` (list + detail pages, API client, TanStack Query hooks), new routes (`/workstreams`, `/workstreams/$workstreamId`), navbar entry changed from "Deliverables" to "Workstreams". `frontend/src/features/deliverables/` loses its list page/route and create-deliverable modal (moved into the workstream detail page); the deliverable edit page (`/deliverables/$deliverableId`) is unchanged. Regenerated typed API client (`pnpm generate:api`).
- No changes to `UserStory`, `AcceptanceCriterion`, `Form`, `FormTemplate`, or their endpoints.
