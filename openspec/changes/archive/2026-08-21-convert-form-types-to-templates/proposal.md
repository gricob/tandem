## Why

Today a `Form`'s fields live entirely on its `FormType` and are shared, unmodified, by every form of that type. Editing or deleting a field on the type retroactively changes what every existing form — including ones with already-submitted responses — is validated against, and can silently orphan stored `response_data`. Renaming `FormType` to `FormTemplate` and moving field ownership onto the `Form` itself (cloned once at creation) freezes each form's structure at the moment it's created, so editing or deleting a template never affects forms already made from it.

## What Changes

- Rename `FormType` to `FormTemplate` everywhere (API routes `/api/v1/form-types` → `/api/v1/form-templates`, module/service/controller names, frontend feature directory and routes, `form_type_id` → `form_template_id`). **BREAKING**
- `FormTemplate` keeps an ordered list of template fields (`FormTemplateField`) with the same CRUD (add, edit, reorder, remove) as today's form-type fields — this is the blueprint used only at form-creation time.
- `Form` gets its own `FormField`s: when a `Form` is created, the referenced template's current fields are cloned into new `FormField` rows owned by that form. **BREAKING**: field ids on a form are no longer the same ids as the template's fields.
- A form's fields are frozen at creation: there is no per-form field editor and no later re-sync from the template. Subsequent edits to the template's fields never affect existing forms.
- `Form.form_template_id` becomes optional. Deleting a `FormTemplate` no longer cascade-deletes the forms created from it; it sets their `form_template_id` to `null` instead, and those forms keep functioning fully with their own fields and responses. **BREAKING**
- `FormResponsesService` validates and stores `response_data` against the form's own `FormField`s directly, instead of walking through its template.

## Capabilities

### New Capabilities
- `form-templates`: reusable form blueprints (rename of `form-types`) — CRUD for the template itself and for its ordered `FormTemplateField`s, used only to seed a new form's fields at creation time.

### Modified Capabilities
- `form-types`: superseded by `form-templates`; all requirements in this capability are removed (see delta spec).
- `forms`: form creation now clones the referenced template's current fields into the form's own `FormField`s; `form_template_id` is optional and survives template deletion as `null`; list/view responses expose the (possibly null) template name; a form's own fields are included when fetching it.
- `form-responses`: `response_data` keys and value validation now reference the form's own `FormField`s directly instead of its `FormType`'s fields; the fill-in and view screens render the form's own fields.

## Impact

- **Backend**: new `FormTemplateField` model (replaces `FormField`'s relation to `FormType`); `FormField.form_type_id` → `FormField.form_id` (cascade-deleted with the `Form`); `Form.form_type_id` → `Form.form_template_id`, made nullable with `onDelete: SetNull`; `form-types` module renamed to `form-templates`; `FormsService.createForm` gains a field-cloning step; `FormResponsesService` drops the template indirection. Clean-slate Prisma migration (no data preservation — current dev data is disposable).
- **Frontend**: `features/form-types/` renamed to `features/form-templates/` (routes, API client, queries, schemas, pages); references to "form type" relabeled "form template" (e.g. `create-form-modal.tsx`, `form-edit-page.tsx`, including a fallback display when a form's template has been deleted).
- **Docs**: `docs/modelo-datos.md` needs its entities, relationships, and diagrams updated to reflect `FormTemplate`/`FormTemplateField` and form-owned `FormField`s.
