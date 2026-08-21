## Context

`FormType`/`FormField` (spec `form-types`) already let a user define a reusable field structure. `Form` (docs/modelo-datos.md §3.2) is the next entity in the chain: a concrete, shareable instance created from a `FormType`, which will later receive a single `FormResponse`. This change builds `Form` CRUD on top of the existing scaffolded backend/frontend and shared-password auth (specs `project-scaffold`, `auth`), following the same pattern established by `form-types`. `FormResponse` depends on `Form` existing first, so this change intentionally stops at `Form`.

## Goals / Non-Goals

**Goals:**
- Persist `Form` per the schema in docs/modelo-datos.md §3.2, §8.
- Expose REST endpoints at `/api/v1/forms`, matching docs/backend.md §5, including name search for the list endpoint.
- Let a user, from the frontend, create a form from an existing form type, edit its name/description, delete it, and browse/search the list of forms.
- Keep the `Controller → Service → Prisma` pattern with no extra domain layer, consistent with docs/backend.md §3, and mirror the conventions already established by `FormTypesModule`.

**Non-Goals:**
- Filling out a form or anything about `FormResponse` (saving/reading `response_data`) — a separate follow-up change.
- Changing a form's `form_type_id` after creation — a form's structure is fixed at creation time; nothing in the MVP scope needs re-parenting.
- Any access control beyond the existing shared-password `AuthGuard`.
- Soft delete, versioning, or publication states for `Form` — deletion is hard delete, consistent with `form-types`.

## Decisions

- **`form_type_id` is immutable after creation.** `POST /api/v1/forms` requires `form_type_id`; `PATCH /api/v1/forms/:formId` only accepts `name`/`description`. Alternative considered: allow changing the form type post-creation — rejected because a `Form`'s whole purpose is to reuse a fixed field structure (docs/modelo-datos.md §2); changing it after responses could exist would orphan `response_data` keyed by `field_id`. Revisit only if a "duplicate form as a different type" use case emerges.
- **Deleting a `Form` does not touch its `FormType`.** Only the `Form` row (and, once it exists, its `FormResponse` via cascade) is removed; the source `FormType` and its fields are untouched. No new decision needed here beyond what docs/modelo-datos.md already implies — stated explicitly to avoid ambiguity during implementation.
- **Name search via a query parameter, not a separate endpoint.** `GET /api/v1/forms?name=<substring>` performs a case-insensitive partial match (Prisma `contains`, `mode: 'insensitive'`) rather than a dedicated `/forms/search` route. Consistent with keeping the list endpoint as the single source for "browse forms," and avoids a second endpoint with near-identical response shape.
- **List response includes the parent form type's `name`.** `GET /api/v1/forms` returns each `Form` with its `form_type_id` and the form type's `name` (denormalized in the read, not the DB) so the frontend list can show "which structure" without an extra round-trip per row. Implemented via a Prisma `include` on the relation, not a schema change.
- **Validation mirrors `form-types`.** `name` required, non-empty; `form_type_id` (create only) must reference an existing `FormType` or the request is rejected `400` (not silently `404`, since the invalid id is one field among others in the payload) — matches how `form-types` validates required string fields, kept consistent for predictability across modules.

## Risks / Trade-offs

- [Hard delete of a `Form` is irreversible, and once `FormResponse` ships it will delete any collected response with it] → Frontend requires an explicit confirmation step before calling delete, same as `form-types`; acceptable for MVP per docs/modelo-datos.md §5 (no soft delete in scope).
- [Denormalizing the form type's `name` into the list response could drift if not kept in sync] → It is read live via Prisma `include` on every request, not cached or duplicated at write time, so there is no drift to manage.
- [Deleting a `FormType` that still has `Form`s pointing to it] → Out of scope for this change to alter (`form-types`' existing cascade delete already removes dependent `Form`s at the DB level once the `Form` relation is added to the schema); flagged here so the `forms` FK is defined with `onDelete: Cascade` from `FormType`, consistent with the existing `FormField` relation.

## Open Questions

- None — scope and shape are settled by the existing domain model (docs/modelo-datos.md) and the API/module conventions already established by `form-types`.
