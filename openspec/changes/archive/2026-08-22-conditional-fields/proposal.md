## Why

Form templates today can only render every field unconditionally, which forces authors to either split closely related forms apart or show fields that don't apply to a given answer path. Letting a field's visibility (and required-ness) depend on other fields' values makes a single form template adapt to the answers already given, without duplicating templates per branch.

## What Changes

- Add a `condition` (nullable JSON expression tree) to `FormTemplateField` and `FormField`: `{ op: "AND"|"OR", clauses: [...] }`, where a clause is either a nested group or a leaf `{ field: <fieldId>, operator, value }`. `null`/absent means always visible.
- Validate conditions on create/edit: every referenced `field` id must belong to the same template/form, its `operator` must be valid for that field's `field_type`, and the reference graph (across all fields, not just the one being edited) must stay acyclic. Reject with `400` otherwise.
- Field reordering (`PUT .../fields/order`) no longer has any relationship to condition validity — `order_index` is purely presentational.
- Deleting a field that one or more other fields' conditions reference is rejected with `400` (must clear or repoint those conditions first).
- Cloning a `FormTemplate`'s fields into a new `Form` (on `POST /api/v1/forms`) remaps `field` references inside each cloned condition tree to the newly generated `FormField` ids, using the same id map already built for the clone.
- A field's effective visibility is resolved recursively: a field is visible if it has no condition, or its condition evaluates to true against the *effective* values of the fields it references (a hidden field's effective value is treated as absent, so hidden-ness propagates through chains of dependent conditions).
- `GET /api/v1/forms/:formId/response`'s `is_complete` only requires a conditional field's answer when that field is currently visible; hidden required fields no longer block completeness.
- `PUT /api/v1/forms/:formId/response` keeps accepting a value for a currently-hidden field (no new rejection) — it is simply not counted for `is_complete` and not treated as satisfying anything while hidden.
- Frontend: the form-template field editor gains a condition builder (choose trigger field(s), operator, value, AND/OR grouping) restricted to fields on the same template; the form fill-in screen becomes reactive, showing/hiding fields as trigger values change and re-evaluating `is_complete` accordingly.

## Capabilities

### New Capabilities
(none — this extends the existing form-templates/forms/form-responses capabilities rather than introducing a new one)

### Modified Capabilities
- `form-templates`: add/edit/delete field requirements gain condition validation (referenced-field, operator/type-compatibility, and acyclic-graph checks); delete-field requirement gains the reject-if-referenced rule.
- `forms`: the field-cloning requirement gains condition-reference remapping.
- `form-responses`: `is_complete` computation becomes condition-aware; the fill-in/view frontend requirements become reactive to visibility.

## Impact

- **Backend**: `backend/src/prisma/schema.prisma` (new `condition` column on `form_template_fields` and `form_fields` + migration), `form-templates` module (condition validation on add/edit field, reference-check on delete), `forms` module (clone remapping), `form-responses` module (visibility/completeness evaluator, reused by both `is_complete` computation and any future validation).
- **Frontend**: `features/form-templates/components/field-form.tsx` (+ new condition-builder component), `features/form-responses/components/response-fields.tsx` (reactive visibility — `features/deliverables/components/inline-fields.tsx` reuses this component, so it inherits the behavior with no separate change).
- **No breaking changes** — `condition` is optional/nullable and defaults to "always visible" for all existing fields.
