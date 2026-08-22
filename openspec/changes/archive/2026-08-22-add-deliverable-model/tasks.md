## 1. Data model

- [x] 1.1 Add `Deliverable` model to `backend/src/prisma/schema.prisma` (`id` ULID, `name`, `description?`, `created_at`, `updated_at`, mapped to table `deliverables`), mirroring `FormTemplate`'s shape
- [x] 1.2 Generate and apply the Prisma migration for the new table

## 2. Backend module

- [x] 2.1 Create `backend/src/modules/deliverables/` with `deliverables.module.ts`, `deliverables.controller.ts`, `deliverables.service.ts`, following the `form-templates` module's Controller → Service → Prisma pattern
- [x] 2.2 Add DTOs: `create-deliverable.dto.ts` (`name` required non-empty, `description?`), `update-deliverable.dto.ts` (`name?` non-empty when present, `description?`), `deliverable-response.dto.ts`
- [x] 2.3 Implement `POST /api/v1/deliverables`, `GET /api/v1/deliverables`, `GET /api/v1/deliverables/:deliverableId`, `PATCH /api/v1/deliverables/:deliverableId`, `DELETE /api/v1/deliverables/:deliverableId`, returning `404` for unknown ids and `400` for invalid/empty `name`
- [x] 2.4 Register `DeliverablesModule` in `backend/src/app.module.ts`
- [x] 2.5 Add backend unit/e2e tests covering create, list, view, edit, delete, and the validation/404 scenarios from the spec

## 3. Frontend feature

- [x] 3.1 Regenerate the typed API client (`pnpm --filter frontend generate:api`) once the backend endpoints exist
- [x] 3.2 Create `frontend/src/features/deliverables/` with `api.ts`, `queries.ts`, `schemas.ts` (Zod schema for name/description), following the `form-templates` feature's structure
- [x] 3.3 Build `deliverables-list-page.tsx`: list of deliverables (name, description), create action (modal/form), delete action with confirmation
- [x] 3.4 Build `deliverable-edit-page.tsx`: edit `name`/`description` with client-side validation blocking an empty name
- [x] 3.5 Add routes `/deliverables` and `/deliverables/$deliverableId` in `frontend/src/app/router.tsx`
- [x] 3.6 Add a "Deliverables" nav entry to `frontend/src/features/navigation/app-navbar.tsx`, active-state matching `pathname.startsWith('/deliverables')`
- [x] 3.7 Add frontend unit/component tests for the list and edit pages; add/extend Playwright e2e coverage for create → edit → delete

## 4. Verification

- [x] 4.1 Run backend lint, typecheck, unit tests, and e2e tests
- [x] 4.2 Run frontend lint, typecheck, unit tests, and e2e tests
