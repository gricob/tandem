## Context

`FormType` and `FormField` are the foundational entities of Tandem's domain (docs/modelo-datos.md §3.1, §3.3): a `FormType` groups an ordered list of `FormField`s that define the data structure any `Form` created from it must collect. Nothing in the domain exists yet — this is the first capability built on top of the scaffolded backend/frontend and the shared-password auth already in place (specs `project-scaffold`, `auth`). `Form` and `FormResponse` depend on `FormType` existing first, so this change intentionally stops at `FormType`/`FormField`.

## Goals / Non-Goals

**Goals:**
- Persist `FormType` and `FormField` per the schema in docs/modelo-datos.md §3.1, §3.3, §8.
- Expose REST endpoints at `/api/v1/form-types` and `/api/v1/form-types/:formTypeId/fields`, matching docs/backend.md §5.
- Let a user, from the frontend, create a form type, add/edit/reorder/remove its fields, and delete the whole form type.
- Keep the `Controller → Service → Prisma` pattern with no extra domain layer, consistent with docs/backend.md §3.

**Non-Goals:**
- Creating `Form` instances from a `FormType`, or anything about `FormResponse` — separate follow-up changes.
- Any access control beyond the existing shared-password `AuthGuard` (no per-form-type permissions).
- Soft delete, versioning, or publication states for `FormType`/`FormField` — deletion is hard delete, consistent with "MVP mínimo" scope.

## Decisions

- **Single module, two resources.** Implement `FormTypesModule` with both `FormType` and `FormField` endpoints (fields nested under `/form-types/:formTypeId/fields`), rather than a separate `FormFieldsModule` as docs/backend.md §9's folder sketch suggests. Fields have no independent lifecycle outside their parent form type (no top-level "list all fields" use case), so splitting into two Nest modules would add indirection without benefit. Revisit only if `FormField` gains behavior independent of `FormType`.
- **Delete cascades.** Deleting a `FormType` cascades to delete its `FormField`s at the database level (Prisma `onDelete: Cascade`). Alternative considered: block deletion while fields exist — rejected because it adds a needless confirmation step for an entity with no downstream data yet (no `Form` can reference a `FormType` with fields still attached, since this change ships before `Form` exists).
- **Reordering via full `order_index` reassignment.** The "reorder fields" endpoint accepts the complete ordered list of field IDs for a form type and rewrites each field's `order_index` in a single transaction, rather than exposing move-up/move-down or a fractional-index scheme. Simpler to implement and reason about at expected list sizes (a form type's field count is small), and matches how the frontend drag-and-drop list will naturally produce its state (a full reordered array).
- **`options` validation shape.** `FormField.options` is stored as `JSONB` (docs/backend.md §4). For `select`/`multi_select` fields the API validates it as a non-empty array of strings; for other `field_type`s the API rejects a non-null `options` value. Keeps the contract strict without introducing a richer options schema (e.g. label/value pairs) that nothing in the MVP scope needs yet.

## Risks / Trade-offs

- [Hard delete of a `FormType` with fields is irreversible] → Frontend requires an explicit confirmation step before calling delete; acceptable for MVP since no `Form`/`FormResponse` can yet depend on it.
- [Nesting fields under one module could get crowded if `FormField` logic grows] → Revisit splitting into a dedicated module if/when field-specific business logic (e.g. field-type-specific validation beyond options) grows significantly.
- [Full-list reorder payload could be misused to silently drop fields not included in the list] → Service validates the submitted ID list is exactly the current set of field IDs for that form type (same length, same members) and rejects (`400`) otherwise.

## Open Questions

- None — scope and shape are settled by the existing domain model and API conventions documented in docs/modelo-datos.md and docs/backend.md.
