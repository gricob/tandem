## Context

`FormType`/`FormField` (spec `form-types`) define a reusable field structure, and `Form` (spec `forms`) is a concrete, shareable instance created from one. `FormResponse` (docs/modelo-datos.md §3.4) is the last piece: the single set of answers a `Form` receives, saved incrementally and editable indefinitely. This change builds `FormResponsesModule` on top of the existing `FormsModule`, `FormTypesModule`, and shared-password auth (specs `forms`, `form-types`, `auth`), following the same `Controller → Service → Prisma` pattern.

## Goals / Non-Goals

**Goals:**
- Persist `FormResponse` per the schema in docs/modelo-datos.md §3.4, §8, with a unique `form_id`.
- Expose `PUT /api/v1/forms/:formId/response` (upsert) and `GET /api/v1/forms/:formId/response`, matching docs/backend.md §5.
- Support incremental saves: a save only needs to carry the field values being set, not the full response.
- Validate submitted values structurally against the form's fields, without ever blocking a save on missing required fields.
- Compute and return response completeness (all `is_required` fields answered) so the frontend doesn't duplicate that rule.
- Let a user, from the frontend, fill in a form's fields, save/re-save at will, and view the response already recorded for a form.

**Non-Goals:**
- Any access control beyond the existing shared-password `AuthGuard`.
- Multiple responses per form (survey mode) — explicitly out of scope per docs/modelo-datos.md §9.2.
- Conditional field logic, response export, or analytics — out of scope per docs/prd.md §6.
- Changing `Form` or `FormType` behavior — this change only adds `FormResponse` on top of them.

## Decisions

- **`PUT /api/v1/forms/:formId/response` is an upsert, not two endpoints.** A single idempotent `PUT` creates the `FormResponse` on first call and updates the same row on every later call, matching the domain rule that a `Form` has at most one response (docs/modelo-datos.md §5.2). Alternative considered: separate `POST` (create) and `PATCH` (update) — rejected because the frontend would need to know whether a response already exists before choosing which verb to call, adding a branch for no benefit; `PUT` upsert removes that check entirely.
- **Saves merge into `response_data` at the field level, not full-replace.** The request body carries only the field values being set (`{ response_data: { <field_id>: value, ... } }`); the backend merges each key into the stored JSON, leaving untouched keys as they were, and clears a field only when its value is explicitly `null`. This directly supports "incremental save" (docs/prd.md §8.2): the frontend never has to resend the whole answer set on every save (e.g. on blur of a single field). Alternative considered: full-replace `PUT` semantics (request body must contain the complete `response_data`) — rejected because it forces the frontend to always hold and resend the entire response state, and makes autosave-per-field patterns error-prone (a stale client-side copy could silently drop a value saved from another session).
- **`GET /api/v1/forms/:formId/response` returns `404` when no response has been saved yet.** Consistent with how `GET /api/v1/forms/:formId` already behaves for a missing `Form` (spec `forms`), and simple for the frontend to special-case into an empty state via TanStack Query's error handling. Alternative considered: `200 OK` with a `null`/empty body — rejected to avoid a second "no data" convention alongside the 404 one already established by `forms` and `form-types`.
- **`response_data` values are validated structurally, but `is_required` is never enforced on save.** Each key in the submitted `response_data` must match an existing `FormField.id` on the form's `FormType`, and its value's shape must match that field's `field_type` (string for `text`/`textarea`, number for `number`, boolean for `boolean`, one of `options` for `select`, a subset of `options` for `multi_select`, ISO date string for `date`); a mismatch on either rejects the whole save with `400`. Whether `is_required` fields are filled only affects the computed `is_complete` flag, never whether the save is accepted — this is the incremental-save rule from docs/modelo-datos.md §5.1, stated explicitly here because it is easy to conflate "required" with "mandatory to save."
- **Completeness is computed on read, not stored.** `is_complete` is derived at request time by checking every `is_required` `FormField` has a non-null value in `response_data`, returned alongside the response but not persisted as a column. Keeps a single source of truth (the field definitions + the data) and avoids a stale flag if fields are added/removed/re-flagged as required after a response was saved.
- **Deleting a `Form` cascades to its `FormResponse`.** Already implied by docs/modelo-datos.md §4 (1:0..1) and flagged in the `create-form` change's risks; this change adds the actual `FormResponse` relation to the Prisma schema with `onDelete: Cascade` from `Form`.

## Risks / Trade-offs

- [A form's fields can change after a response was partly or fully saved (e.g. a field is deleted or its `field_type` changes on the parent `FormType`)] → Out of scope to prevent structurally; on read, `response_data` keys with no matching current `FormField` are simply ignored by the completeness/rendering logic rather than erroring, so stale answers don't break the view. Editing a form's structure after responses exist is an accepted MVP trade-off, consistent with there being no versioning or publication states (docs/modelo-datos.md §9.2).
- [Field-level merge semantics mean a client can never "clear the whole response" in one call] → Not needed for MVP: docs/prd.md's user stories only call for editing individual answers, not resetting a response; a form can still be effectively cleared by sending `null` for every field id if that need arises.
- [Structural validation duplicates knowledge of `field_type` shapes between `FormFieldsModule` (definition) and `FormResponsesModule` (validation)] → Both live in the same backend and read the same `FormField` rows at request time, so there's no schema drift to manage; a shared validator function can be extracted if a third consumer appears, but isn't justified for two.

## Open Questions

- None — scope and shape are settled by the existing domain model (docs/modelo-datos.md) and the API conventions already established by `forms` and `form-types`.
