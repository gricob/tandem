## Context

Fields today are fully independent rows (`FormTemplateField`, `FormField`): `label`, `field_type`, `is_required`, `options`, `order_index`, no cross-field references. `Form` fields are a one-time clone of `FormTemplate` fields at `POST /api/v1/forms` time (deliberately decoupled — a form keeps working after its template changes or is deleted). `FormResponse.response_data` is a flat `{ field_id: value }` map, and `is_complete` is currently "every `is_required` field has a non-null value."

This design adds the first cross-field relationship in the system: a field's visibility (and thus its effective required-ness) can depend on other fields' values, expressed as an AND/OR tree of comparisons.

## Goals / Non-Goals

**Goals:**
- Let a template/form field declare a condition tree that determines whether it's shown.
- Keep the condition model symmetric on `FormTemplateField` and `FormField`, surviving the template→form clone with ids correctly remapped.
- Keep `order_index` purely presentational — no coupling between display order and dependency validity.
- Make `is_complete` and the fill-in UI aware of visibility without changing the response-saving contract (`PUT .../response` stays permissive).

**Non-Goals:**
- No computed/derived field values (conditions only gate visibility, they never set a value).
- No condition types beyond comparisons on a single referenced field per leaf (no cross-field arithmetic like "A + B > 10").
- No versioning/history of condition changes.
- No condition support at the `FormResponse` validation layer beyond what's needed for `is_complete` (i.e., `PUT .../response` does not reject or filter based on conditions — see Decision 6).

## Decisions

### 1. Condition shape: recursive JSON tree, stored inline on the field

```json
{
  "op": "AND",
  "clauses": [
    { "field": "01H...", "operator": "equals", "value": "yes" },
    { "op": "OR", "clauses": [
      { "field": "01H...", "operator": "gt", "value": 5 },
      { "field": "01H...", "operator": "is_not_empty" }
    ]}
  ]
}
```
Stored as a nullable `condition Json?` column directly on `FormTemplateField`/`FormField` (not a normalized join table). `null` means always visible.

**Alternative considered**: a separate `FieldCondition` table with one row per leaf clause, FK'd to the field and to the referenced field. Rejected — an AND/OR tree needs recursive nesting, which an adjacency-list-of-rows makes both harder to write correctly (multiple inserts + parent/child linking per save) and harder to read back into the shape the evaluator needs, for no relational-query benefit (nothing needs to `WHERE` across conditions directly; the whole tree is always read together with its field).

### 2. Operators are validated against the referenced field's `field_type`

Each `field_type` has a fixed operator set:
- `text` / `textarea`: `equals`, `not_equals`, `contains`, `is_empty`, `is_not_empty`
- `number`: `equals`, `not_equals`, `gt`, `gte`, `lt`, `lte`, `is_empty`, `is_not_empty`
- `boolean`: `equals` (value `true`/`false`)
- `select`: `equals`, `not_equals`
- `multi_select`: `contains`, `not_contains`, `is_empty`, `is_not_empty`
- `date`: `equals`, `before`, `after`, `is_empty`, `is_not_empty`

For `select`/`multi_select`, `value` must additionally be one of the referenced field's current `options` for `equals`/`not_equals`/`contains`/`not_contains`.

**Alternative considered**: a single generic `equals`/`not_equals` for every type, letting the frontend encode richer comparisons client-side only. Rejected because `is_complete` is computed server-side and must be able to evaluate the same condition the UI shows — the evaluator needs real operator semantics, not just string equality.

### 3. Validation graph is independent of `order_index`

`FormField`s have no add/edit endpoints of their own — they're set once at clone time (Decision 7) and are otherwise immutable, same as `label`/`field_type`/`options` today. So condition validation only runs where fields are actually authored: `FormTemplateField` add/edit. On add/edit of a template field's condition, the backend:
1. Resolves every `field` id referenced anywhere in the tree and confirms it belongs to the same `FormTemplate`/`Form`.
2. Checks each leaf's `operator` is valid for that referenced field's `field_type` (and `value` is one of `options` where applicable).
3. Builds the full reference graph across *all* fields on that template/form (existing conditions + the one being written) and walks outward from the edited field to detect a cycle. Rejects with `400` if one exists.

`order_index` / the reorder endpoint has no role in this — reordering never touches `condition`, and no dependency-order check runs on reorder. A field can reference another field regardless of which one currently displays first.

**Alternative considered**: require a referenced field to have a lower `order_index` (top-to-bottom dependency) to make validation and evaluation trivially cycle-free, re-validated on every reorder. Rejected per explicit product direction — it added a real constraint (reordering could fail or silently break conditions) for a guarantee (no cycles) that a direct graph-cycle check gives for free, without touching reorder at all.

### 4. Visibility evaluator: recursive + memoized, hidden ⇒ effectively absent

A pure function, given a field list + their conditions + a `response_data` map, computes visibility for every field:

```
isVisible(field, memo):
  if field.id in memo: return memo[field.id]
  if field.condition is null: return true
  result = evaluate(field.condition, effectiveValue, memo)
  memo[field.id] = result
  return result

effectiveValue(fieldId, memo):
  targetField = lookup(fieldId)
  if not isVisible(targetField, memo): return ABSENT
  return response_data[fieldId]
```
Because validation (Decision 3) already guarantees the reference graph is acyclic, this recursion always terminates; memoization keeps it O(fields). This one function is reused both server-side (for `is_complete`, Decision 5) and ported to the frontend (for reactive show/hide, Decision 7) — same semantics in both places by construction, not by convention.

**Alternative considered**: iterative topological-sort evaluation ordered by a precomputed dependency order. Equivalent result, more machinery (needs to compute and cache a topo order separately from the recursion); the memoized-recursive form is simpler and the graph is small (form field counts are modest).

### 5. `is_complete` = every *visible* required field has a value

`GET /api/v1/forms/:formId/response` computes `is_complete` by running the evaluator against the form's fields and the stored `response_data`, then checking `is_required` only for fields where `isVisible` is true. A hidden required field never blocks completeness.

### 6. `PUT .../response` stays permissive — no rejection or server-side clearing for hidden fields

A value submitted for a currently-hidden field is accepted and stored as-is (same merge/upsert semantics as today), simply excluded from `is_complete` and from other fields' `effectiveValue` while hidden. No new 400 case, no auto-null.

**Alternative considered**: reject values for hidden fields, or auto-clear a field's stored value the moment it becomes hidden. Both rejected — rejecting requires the backend to evaluate the *entire* current state on every partial save (contradicts the existing "each key merges independently" incremental-save model) and risks races between the client's and server's view of "currently hidden"; auto-clearing on every response save adds a write-time side effect for a value the evaluator already treats as absent. Accept-and-ignore keeps `PUT` exactly as simple as it is today.

### 7. Cloning remaps `field` references inside `condition`

`POST /api/v1/forms` already builds an old-`FormTemplateField`-id → new-`FormField`-id map while cloning fields. This design extends that clone step to deep-walk each cloned field's `condition` tree and rewrite every leaf's `field` id through that same map before saving the new `FormField`.

### 8. Deleting a referenced field is rejected

`DELETE .../fields/:fieldId` (template or form field) first checks whether any *other* field on the same template/form has a condition referencing this field id anywhere in its tree. If so, respond `400` (e.g. "N field(s) depend on this field") and delete nothing. The caller must edit/clear those conditions first.

**Alternative considered**: cascade-clear referencing conditions (set them back to unconditional) on delete. Rejected — deletion is already irreversible; silently changing another field's behavior (making it always-visible when it was intentionally conditional) as a side effect is more surprising than an explicit rejection the caller can act on.

## Risks / Trade-offs

- **[Risk]** Arbitrary-depth AND/OR trees make the condition-builder UI and the "which fields am I allowed to pick" logic more complex than a flat clause list. → Mitigation: the frontend can still default to a flat single-group UI (all-AND or all-OR) for the common case and only expose nesting as an "add group" affordance; the data model supports it either way.
- **[Risk]** Because references aren't order-constrained, a form author can build a condition that reads "backwards" (a field near the top depending on one near the bottom), which may be confusing to read in the editor even though it evaluates correctly. → Mitigation: the field editor can visually flag/label a field's dependencies regardless of position; no functional issue, just an editor affordance to consider.
- **[Risk]** `options` can change (edit) or shrink after a condition already references a specific option value (e.g. condition says `field = "Blue"`, then "Blue" is removed from that select field's `options`). The condition becomes permanently false but isn't invalid. → Mitigation: out of scope for this change to auto-detect/flag; acceptable since it fails safe (field stays hidden, doesn't crash). Could be a follow-up (surface a "stale reference" warning in the editor).
- **[Trade-off]** Evaluating visibility server-side (for `is_complete`) and separately in the frontend (for rendering) means the same evaluator logic must be kept in sync in two languages/codebases (Nest/TS backend, React/TS frontend — same language, different packages). → Mitigation: implement the evaluator as a small pure function with no framework dependencies so it's trivially portable/testable identically on both sides; consider a shared package only if drift becomes a real problem.

## Migration Plan

1. Prisma migration: add nullable `condition Json?` to `form_template_fields` and `form_fields`. Backward compatible — existing rows get `null` (always visible), no data backfill needed.
2. Backend: add condition validation (Decision 2–3) to the existing add-field/edit-field endpoints, add the reference-check to delete-field, extend the clone step (Decision 7), extend the `is_complete` computation (Decision 5).
3. Frontend: add the condition-builder UI to the template field editor, make `ResponseFields` (and by extension `InlineFields`, which reuses it) evaluate visibility reactively.
4. No rollback complexity beyond a standard down-migration dropping the two columns — no existing behavior changes for fields that never set a `condition`.

## Open Questions

- Should the condition-builder UI ship with nesting from day one, or start flat (single AND or single OR group) and add nesting later? Data model and backend support either; this is purely a frontend-scope call for the tasks breakdown.
- Should a "stale condition" (references an option value that no longer exists) be surfaced anywhere in the editor, or left silent as described above? Left out of scope for this change; noted as a possible follow-up.
