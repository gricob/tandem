## Context

Today `FormField` belongs to `FormType`, and every `Form` of a given type shares the exact same `FormField` rows (`forms.service.ts` only stores `form_type_id`; `form-responses.service.ts` reads fields via `form → formType → fields`). Editing or deleting a field on the type retroactively changes what every form of that type validates against, including forms with already-submitted `FormResponse`s, whose `response_data` is keyed by `field_id` — an edit or removal can silently invalidate or orphan stored answers.

This change repurposes `FormType` as `FormTemplate`, a reusable blueprint, and gives every `Form` its own `FormField`s, cloned from the template once at creation time. This is a schema and API change touching the `form-types`, `forms`, and `form-responses` capabilities together, and it's a pre-launch change (all three existing Prisma migrations are dated the same day as this proposal), so it's an appropriate point to make the model change cleanly rather than accrete a compatibility shim.

## Goals / Non-Goals

**Goals:**
- Decouple an existing form's structure (and thus its response data) from later edits to, or deletion of, the template it was created from.
- Keep the template's field-builder UX (add/edit/reorder/remove fields) exactly as it works today for `form-types`, just renamed and scoped to `FormTemplate`.
- Keep the change minimal: no new form-side field-management UI, no template/form sync mechanism.

**Non-Goals:**
- Per-form field editing after creation (fields are frozen at creation; see Decisions).
- Re-syncing a form's fields from its template after the fact.
- Preserving existing dev data across the schema change (clean-slate migration).
- Template versioning or history.

## Decisions

### Two distinct field models: `FormTemplateField` and `FormField`
`FormTemplateField` belongs to `FormTemplate` (the blueprint, edited via the template's field builder); `FormField` belongs to `Form` (the frozen, per-instance copy). Both share the same shape (`label`, `field_type`, `is_required`, `options`, `order_index`), but they are kept as separate Prisma models rather than one `FormField` model with two nullable foreign keys (`form_template_id`/`form_id`) gated by a check constraint. The dual-FK approach saves a table but blurs ownership (queries and cascade-delete behavior would need to branch on which FK is set), and Prisma has no native polymorphic/either-or relation — the constraint would live outside the schema. Two single-purpose models keep each one's cascade behavior and query shape unambiguous at the cost of a small amount of duplicated column definitions.

### Fields are cloned once at creation and frozen
`FormsService.createForm` clones the template's current `FormTemplateField`s into new `FormField` rows (new ids, same `label`/`field_type`/`is_required`/`options`/`order_index`) inside the same transaction as the `Form` insert. After that, a form's fields never change: no add/edit/reorder/remove endpoints exist on the `Form` side, and there is no "re-sync from template" action.

Alternatives considered: (a) let a form's fields be edited independently after creation — rejected for this change since it's a UI/API surface nobody asked for and adds meaningful scope (a full field-builder on the form side); (b) an explicit "sync from template" action — rejected for now since it raises unresolved questions about merging a synced field set with existing `response_data` for fields that changed or disappeared. Both remain compatible future extensions if a real need shows up, since the frozen-clone model doesn't foreclose them.

### `Form.form_template_id` becomes nullable, `onDelete: SetNull`
Since a form's fields are self-sufficient after creation, a `Form` no longer functionally depends on its `FormTemplate` existing. Deleting a template sets `form_template_id` to `null` on any forms that reference it instead of cascading the delete.

Alternatives considered: (a) keep today's `onDelete: Cascade` — rejected, since it would still destroy every form (and its responses) whenever someone cleans up a template, which is exactly the coupling this change removes; (b) `onDelete: Restrict` (block template deletion while forms reference it) — rejected, since a template that's ever been used could then never be deleted, and there's no remaining technical reason to require it (the referencing forms don't need the template for anything after creation).

### Clean-slate migration
All three existing migrations are dated the same day as this proposal — there's no real data to preserve. Rather than writing a data transform (clone each existing form's shared `FormField`s into owned rows, remap `FormResponse.response_data` keys to the new ids), this change ships a fresh migration against the new schema and treats current dev data as disposable.

## Risks / Trade-offs

- **[Risk]** Broad, mechanical rename surface (routes, module/service/controller names, frontend feature directory, DTOs, generated OpenAPI client, existing test suites referencing `/form-types` and "form type" copy) makes it easy to miss a spot. → **Mitigation**: grep for `form-type`/`formType`/"form type" across both `backend/src` and `frontend/src` (tests included) as a completion check before considering the change done.
- **[Risk]** The frontend's typed API client is generated from the backend's OpenAPI contract; frontend work will fail to typecheck against a stale client if sequenced ahead of the backend rename. → **Mitigation**: land and regenerate the backend contract first, then do frontend work against the regenerated client.
- **[Risk]** This is a breaking API change (routes and field-id semantics change). → **Mitigation**: acceptable pre-launch with no external consumers; no compatibility shim planned.

## Migration Plan

1. Update `schema.prisma`: rename `FormType` → `FormTemplate`; add `FormTemplateField` (replaces `FormField`'s current relation to the type); repoint `FormField` at `Form` (`form_id`, cascade-deleted with the form); make `Form.form_template_id` nullable with `onDelete: SetNull`. Generate a fresh migration and regenerate the Prisma client.
2. Rename the backend `form-types` module to `form-templates` (controller, service, DTOs, routes `/api/v1/form-types` → `/api/v1/form-templates`), keeping its existing CRUD behavior for the template and its fields.
3. Update `FormsService.createForm` to clone the template's fields into the new form's own `FormField`s.
4. Update `FormResponsesService` to read/validate against the form's own `FormField`s directly, dropping the `formType` join.
5. Regenerate the OpenAPI contract and the frontend's generated API client.
6. Rename `frontend/src/features/form-types/` → `frontend/src/features/form-templates/` (routes, api client, queries, schemas, pages) and update references in `features/forms/` and `features/form-responses/` (labels, the form edit page's fallback display for a deleted template).
7. Update backend and frontend tests (unit and e2e) to match the renamed routes/entities and the new clone-at-creation, frozen-fields, orphan-on-delete behavior.
8. Update `docs/modelo-datos.md` (entities, relationships, diagrams) to match.

No rollback plan beyond reverting the commit/migration — this is a schema change against disposable pre-launch dev data, not a production data migration.

## Open Questions

None blocking; naming of the new DTOs/OpenAPI schemas for `FormTemplateField` and the exact fallback copy for an orphaned form's template label are left as implementation details for `tasks.md`.
