## 1. Data model

- [x] 1.1 Add `Workstream` model to `backend/src/prisma/schema.prisma`: `id` (char(26), PK), `name`, `description` (optional), `createdAt`, `updatedAt`, inverse `deliverables` relation.
- [x] 1.2 Add `workstreamId` (FK to `Workstream`, `onDelete: Cascade`) and `orderIndex` to `Deliverable`; add the inverse `workstream` relation and an index on `workstreamId`.
- [x] 1.3 Generate and review the Prisma migration for the new table and the `Deliverable` column additions (note: existing `deliverables` rows have no valid `workstreamId` — since this is a dev database with no production data to migrate, drop and recreate the table rather than writing a backfill).

## 2. Backend: deliverables module changes

- [x] 2.1 Remove `createDeliverable`/`findAllDeliverables` from `DeliverablesController`/`DeliverablesService` (flat `POST`/`GET` list-all); keep `getDeliverable`, `updateDeliverable`, `deleteDeliverable` unchanged.
- [x] 2.2 Add an internal `DeliverablesService` method (e.g. `createDeliverableForWorkstream(workstreamId, dto)`) that creates a `Deliverable` with `workstreamId` set and `order_index = max + 1` for that workstream, and a `reorderDeliverables(workstreamId, deliverableIds)` method mirroring `UserStoriesService.reorderUserStories` (400 if the id set doesn't match exactly), for `WorkstreamsService` to call.
- [x] 2.3 Update `DeliverableResponseDto` to include `workstreamId` and `orderIndex`.
- [x] 2.4 Update `CreateDeliverableDto`/`UpdateDeliverableDto` so `workstreamId` cannot be set/changed via `PATCH /deliverables/:deliverableId` (not part of `UpdateDeliverableDto`).

## 3. Backend: workstreams module

- [x] 3.1 Add `CreateWorkstreamDto` (`name` required non-empty, optional `description`) and `UpdateWorkstreamDto` (both optional, non-empty if present), matching `deliverables`' DTO style.
- [x] 3.2 Add `WorkstreamResponseDto` (`id`, `name`, `description`, `createdAt`, `updatedAt`, `deliverables: DeliverableResponseDto[]`).
- [x] 3.3 Create `WorkstreamsModule`/`WorkstreamsService`/`WorkstreamsController` (routes prefixed `workstreams`), importing `DeliverablesModule` for the shared create/reorder/cascade-delete logic. Register the module in `app.module.ts`.
- [x] 3.4 Implement `createWorkstream`, `findAllWorkstreams`, `getWorkstream`, `updateWorkstream` (Controller → Service → Prisma, following `DeliverablesController`'s exact shape).
- [x] 3.5 `findAllWorkstreams`/`getWorkstream` include `deliverables` sorted by `order_index`, each shaped like the existing `DeliverableResponseDto` (with its `userStories`/`acceptanceCriteria` embedded as today).
- [x] 3.6 Implement `deleteWorkstream`: in one transaction, run the existing deliverable-cascade-delete logic (forms behind acceptance criteria, then behind user stories, then the deliverables) for every deliverable on the workstream, then delete the workstream row. 404 if the workstream doesn't exist.
- [x] 3.7 Add controller routes: `POST /workstreams`, `GET /workstreams`, `GET /workstreams/:workstreamId`, `PATCH /workstreams/:workstreamId`, `DELETE /workstreams/:workstreamId`, `POST /workstreams/:workstreamId/deliverables`, `PUT /workstreams/:workstreamId/deliverables/order`, with Swagger decorators matching existing endpoints' style.

## 4. Backend tests

- [x] 4.1 Write `workstreams.service.spec.ts` (mocked Prisma + mocked `DeliverablesService`) covering create/list/get/update/delete, including the cascade-delete-through-deliverables path.
- [x] 4.2 Write `workstreams.e2e-spec.ts` (Supertest) covering: create (including missing-name validation), list, get (including 404), edit (including empty-name rejection and 404), delete (including 404 and leaving nothing orphaned when the workstream has deliverables with user stories/acceptance criteria), add-deliverable (including missing-name validation and 404 on missing workstream), reorder-deliverables (success and mismatched-id-set rejection).
- [x] 4.3 Update `deliverables.e2e-spec.ts`/`deliverables.service.spec.ts`: remove tests for the removed flat create/list-all endpoints, add a workstream fixture (created via the new workstream endpoints) for every remaining deliverable test, and assert `workstreamId`/`orderIndex` appear in deliverable responses. Also updated `user-stories-acceptance-criteria.e2e-spec.ts`'s `createDeliverable` fixture helper, which relied on the removed flat `POST /deliverables`.

## 5. Frontend: API client and types

- [x] 5.1 Regenerate the typed OpenAPI client (`pnpm --filter frontend generate:api`) after the backend contract changes.
- [x] 5.2 Create `frontend/src/features/workstreams/api.ts` (create/list/get/update/delete workstream, add/reorder deliverable) and `queries.ts` (TanStack Query hooks), following the `deliverables` feature's pattern.
- [x] 5.3 Create `frontend/src/features/workstreams/schemas.ts` (Zod schema for workstream name/description and for adding a deliverable), mirroring `deliverables/schemas.ts`.
- [x] 5.4 Update `frontend/src/features/deliverables/api.ts`/`queries.ts`: remove the flat create/list-all functions and hooks; keep get/update/delete.

## 6. Frontend: workstreams screens

- [x] 6.1 Add `workstreams-list-page.tsx` (table of name/description, create modal, delete-confirm modal), modeled on `deliverables-list-page.tsx`.
- [x] 6.2 Add `workstream-detail-page.tsx`: edit `name`/`description`, and a deliverables section listing name/description in `order_index` order.
- [x] 6.3 Add `components/create-deliverable-modal.tsx` (name + optional description) and a delete-confirm modal for a deliverable, under `frontend/src/features/workstreams/components/`, reusing `deliverables`' existing modal as a reference (that one is removed in 7.2).
- [x] 6.4 Add drag-and-drop reordering for deliverables on the workstream detail screen (via `@dnd-kit`, mirroring `user-story-list.tsx`), calling the reorder endpoint and reflecting the new order immediately.
- [x] 6.5 Each listed deliverable links to its existing edit route (`/deliverables/$deliverableId`).

## 7. Frontend: routing, navigation, and cleanup

- [x] 7.1 Add routes `/workstreams` and `/workstreams/$workstreamId` in `frontend/src/app/router.tsx`.
- [x] 7.2 Remove `deliverables-list-page.tsx`, its route, and `frontend/src/features/deliverables/components/create-deliverable-modal.tsx` (superseded by the workstream detail screen's own). Also removed `frontend/src/features/deliverables/components/confirm-delete-modal.tsx`, left orphaned by the same removal (workstreams has its own copy).
- [x] 7.3 Update `frontend/src/features/navigation/app-navbar.tsx`: replace the "Deliverables" nav entry with "Workstreams" (`/workstreams`, active-state via `pathname.startsWith('/workstreams')`).

## 8. Frontend tests

- [x] 8.1 Add component tests for `workstreams-list-page.tsx`/its create+delete modals, mirroring the existing deliverables list page tests.
- [x] 8.2 Add component tests for the workstream detail screen: editing name/description, adding a deliverable, removing a deliverable. (Drag-and-drop reordering isn't exercised by these RTL tests, consistent with `user-story-list.test.tsx` — jsdom can't simulate pointer-based dnd-kit drags.)
- [x] 8.3 Remove/replace the now-obsolete `deliverables-list-page`-related unit tests; move `create-deliverable-modal.test.tsx` to test the new `workstreams/components/create-deliverable-modal.tsx`, replace `deliverable-confirm-delete-modal.test.tsx` with `workstream-confirm-delete-modal.test.tsx`, add `create-workstream-modal.test.tsx` and `deliverable-list.test.tsx`, and update `app-navbar.test.tsx`'s "Deliverables" references to "Workstreams".
- [x] 8.4 Update Playwright e2e specs: replaced `deliverables.spec.ts` with `workstreams.spec.ts` covering create/edit/delete workstream, add/remove a deliverable from the workstream detail screen, and navigating into/editing the deliverable's own edit screen (no dedicated user-stories/acceptance-criteria Playwright spec existed to adjust).

## 9. Verification

- [x] 9.1 Run backend lint, typecheck, and test suite.
- [x] 9.2 Run frontend lint, typecheck, and test suite.
- [x] 9.3 Exercised the golden path in a real Chromium browser via the new `workstreams.spec.ts` Playwright e2e test: create workstream → add deliverable → navigate into its edit page → edit and save → navigate back → remove the deliverable → delete the workstream. (Interactive chrome-devtools verification was unavailable — its shared browser profile was locked by a concurrent Claude Code session — so this substituted for manual poking; the backend e2e suite separately covers deleting a workstream with nested user stories/acceptance criteria and reordering.)
