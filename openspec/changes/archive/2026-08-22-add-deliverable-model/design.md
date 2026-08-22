## Context

Every existing entity in Tandem (`FormTemplate`, `Form`, `FormResponse`) follows the same simple pattern: a Prisma model with a ULID id and timestamps, a NestJS module with Controller → Service → Prisma (no domain/repository layer), and a frontend feature with list/edit screens using TanStack Query + Mantine. `Deliverable` is the simplest possible addition to this domain: a bare record with no child entities and no relations to anything else.

## Goals / Non-Goals

**Goals:**
- Add `Deliverable` as a fully standalone CRUD entity, consistent with the existing module/feature conventions.
- Keep the model minimal: `name`, `description`, timestamps — nothing else.

**Non-Goals:**
- No relation between `Deliverable` and `Form`/`FormTemplate`/`FormResponse`. Any future connection is out of scope for this change.
- No status/lifecycle field (e.g. planned/in-progress/delivered). Not needed while the model is unconnected to anything that would give that state meaning.
- No ownership, assignment, or access control — consistent with the rest of the domain (no user accounts beyond the shared-password gate).

## Decisions

- **Model shape mirrors `FormTemplate`** (`id`, `name`, `description?`, `created_at`, `updated_at`) since it is the closest existing precedent for a standalone, relation-free entity. Table name: `deliverables`.
- **CRUD surface mirrors `FormTemplate`'s base operations** (create, list, view, edit, delete) minus anything related to child fields, since `Deliverable` has none: `POST /api/v1/deliverables`, `GET /api/v1/deliverables`, `GET /api/v1/deliverables/:deliverableId`, `PATCH /api/v1/deliverables/:deliverableId`, `DELETE /api/v1/deliverables/:deliverableId`. All routes sit behind the existing global `AuthGuard`, same as every other route.
- **Frontend mirrors the `form-templates` feature's list/edit split**: a list screen (name, description, create action, delete action with confirmation) and an edit screen for `name`/`description`. Added as its own top-level nav entry, not nested under Forms.
- **No new module dependencies**: reuses `ulid`, `class-validator`, `@nestjs/swagger`, TanStack Query, Mantine, `@mantine/form` + Zod exactly as already used elsewhere.

## Risks / Trade-offs

- [Shipping a disconnected record with no relations may look incomplete or "why does this exist?" to anyone unfamiliar with the plan] → Mitigated by proposal explicitly framing this as groundwork; no functional promise is being made about future connections.
- [Delete is unconditional/permanent, same as `FormTemplate` when it has no forms] → Acceptable since there is nothing yet that references a `Deliverable`, so there's no cascading/orphaning concern to design around.

## Open Questions

None — scope was explicitly narrowed to a standalone model with full CRUD, matching existing conventions.
