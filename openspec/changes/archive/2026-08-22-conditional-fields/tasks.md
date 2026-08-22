## 1. Data model

- [x] 1.1 Add nullable `condition Json?` column to `FormTemplateField` and `FormField` in `backend/src/prisma/schema.prisma`
- [x] 1.2 Generate and apply the Prisma migration (no backfill needed — existing rows default to `null`)

## 2. Shared condition evaluator (backend)

- [x] 2.1 Define the condition tree types (leaf `{ field, operator, value }`, group `{ op: "AND"|"OR", clauses }`) and the per-`field_type` operator table (design.md Decision 2) in a shared, framework-free module (e.g. `backend/src/modules/form-templates/condition/`)
- [x] 2.2 Implement `validateCondition(condition, fields)`: checks every referenced `field` id belongs to the given field list, every leaf's `operator` is valid for that field's `field_type`, and (for `select`/`multi_select`) `value` is one of that field's `options`
- [x] 2.3 Implement cycle detection: given a field list with conditions (including a pending new/edited one), walk the reference graph outward from the edited field and detect cycles
- [x] 2.4 Implement the recursive/memoized visibility evaluator (design.md Decision 4): `resolveVisibility(fields, responseData) -> Map<fieldId, boolean>`, with hidden fields treated as having an absent effective value for fields that reference them
- [x] 2.5 Unit tests for the evaluator: always-visible fields, single condition, AND/OR nesting, transitive hiding through a chain of conditional fields, cycle rejection, operator/type-mismatch rejection, cross-template field-reference rejection

## 3. Form templates: authoring conditions

- [x] 3.1 Add `condition` to `CreateFormTemplateFieldDto` and `UpdateFormTemplateFieldDto` (nullable, validated shape)
- [x] 3.2 In `form-templates.service.ts`, run `validateCondition` + cycle detection (from section 2) on add-field and edit-field, scoped to the target form template's fields; return `400` on failure
- [x] 3.3 Include `condition` in `FormTemplateFieldResponseDto`
- [x] 3.4 In `form-templates.service.ts`, reject `DELETE .../fields/:fieldId` with `400` when another field on the same template has a `condition` referencing it; no other field's `condition` is exempt
- [x] 3.5 Backend tests: valid condition on create/edit, reference to unknown/foreign field rejected, operator/type mismatch rejected, cycle rejected, delete blocked when referenced, delete allowed when unreferenced, clearing a condition via `PATCH` with `condition: null`

## 4. Forms: cloning conditions

- [x] 4.1 In `forms.service.ts`, extend the template→form field clone to deep-walk each cloned field's `condition` tree and rewrite every leaf's `field` id through the existing old-id→new-id map before persisting the new `FormField`
- [x] 4.2 Include `condition` in `FormFieldResponseDto`
- [x] 4.3 Backend tests: a form created from a template with a conditional field has its own field's `condition` pointing at its own cloned field id, and evaluates equivalently to the source

## 5. Form responses: condition-aware completeness

- [x] 5.1 In `form-responses.service.ts`, use the shared evaluator (section 2) to compute visibility for a form's fields against its `response_data`, and change `is_complete` to only require visible `is_required` fields
- [x] 5.2 Confirm `PUT .../response` needs no change to its accept/reject logic (values for hidden fields are already accepted as ordinary field values) — add a regression test asserting this explicitly
- [x] 5.3 Backend tests: hidden required field doesn't block `is_complete`; visible required field still blocks it; a stored value for a since-hidden field doesn't retroactively satisfy completeness

## 6. Frontend: condition builder in the template field editor

- [x] 6.1 Regenerate the typed API client (`openapi-typescript`) to pick up `condition` on template/form field schemas
- [x] 6.2 Build a condition-builder component: pick a trigger field (restricted to other fields already on the template), an operator (restricted to those valid for the trigger field's `field_type`), and a value; support adding/removing AND/OR groups with nesting
- [x] 6.3 Wire the condition builder into `frontend/src/features/form-templates/components/field-form.tsx` (add + edit flows), submitting `condition` alongside the existing field properties
- [x] 6.4 Surface the backend's "field is referenced by other conditions" `400` as an inline error when deleting a field from `frontend/src/features/form-templates/components/field-list.tsx`
- [x] 6.5 Component tests for the condition builder and its integration into `field-form.tsx`

## 7. Frontend: reactive visibility when filling in / viewing a response

- [x] 7.1 Port the visibility evaluator (section 2) as a small pure TS function usable from the frontend (e.g. `frontend/src/features/form-responses/condition-utils.ts`), mirroring the backend's semantics
- [x] 7.2 Update `frontend/src/features/form-responses/components/response-fields.tsx` to compute visibility from the live in-progress form values and only render visible fields, recomputing as any trigger field changes
- [x] 7.3 Update the missing-required-fields indicator (wherever `is_complete`/missing fields are surfaced in the fill-in flow) to skip hidden fields, consistent with the backend's `is_complete`
- [x] 7.4 Update the response-view screen to skip rendering a field (and its stored value) when its condition doesn't currently evaluate to true against the saved `response_data`
- [x] 7.5 Component tests: hiding/showing fields as a trigger value changes, transitive hiding through a chain, hidden field excluded from the missing-required indicator, hidden field's stale value not shown on the view screen

## 8. Verification

- [x] 8.1 Run backend lint, typecheck, and test suite
- [x] 8.2 Run frontend lint, typecheck, and test suite
- [x] 8.3 Manually exercise the flow: create a template with a boolean trigger field and a dependent required field, create a form from it, verify fill-in hides/shows the dependent field and `is_complete` behaves correctly, verify deleting the trigger field is blocked while the dependent condition exists
