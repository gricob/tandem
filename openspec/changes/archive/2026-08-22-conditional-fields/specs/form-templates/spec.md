## MODIFIED Requirements

### Requirement: Add a field to a form template
The backend SHALL expose `POST /api/v1/form-templates/:formTemplateId/fields`, requiring a valid session token, that creates a `FormTemplateField` on the given form template with `label` (required, non-empty), `field_type` (required, one of `text`, `textarea`, `number`, `boolean`, `select`, `multi_select`, `date`), `is_required` (boolean, defaults to `false`), `options` (required non-empty array of strings when `field_type` is `select` or `multi_select`; must be omitted or null otherwise), and an optional `condition` (a nullable expression tree; `null`/omitted means the field is always visible). New fields are appended after existing fields (highest `order_index` + 1).

A `condition` is a tree of the shape `{ op: "AND"|"OR", clauses: [...] }` where each clause is either a nested group of the same shape or a leaf `{ field: <fieldId>, operator, value }`. Every `field` id referenced anywhere in the tree (at any depth) MUST belong to a `FormTemplateField` on the same form template; each leaf's `operator` MUST be valid for that referenced field's `field_type` (and, for `select`/`multi_select`, `value` must be one of that field's current `options` where the operator compares against a specific option); and the full reference graph across all of the form template's fields' conditions, including the one being created, MUST remain acyclic. A field's `order_index` (its display position) has no bearing on which fields it may reference.

#### Scenario: Valid field is added
- **WHEN** an authenticated client calls `POST /api/v1/form-templates/:formTemplateId/fields` with a valid `label` and `field_type`
- **THEN** the response is `201 Created` with the new `FormTemplateField`, appended after any existing fields on that form template

#### Scenario: Select field without options is rejected
- **WHEN** an authenticated client calls `POST /api/v1/form-templates/:formTemplateId/fields` with `field_type` set to `select` or `multi_select` and a missing or empty `options` array
- **THEN** the response is `400 Bad Request` and no field is created

#### Scenario: Non-select field with options is rejected
- **WHEN** an authenticated client calls `POST /api/v1/form-templates/:formTemplateId/fields` with `field_type` other than `select`/`multi_select` and a non-null `options` value
- **THEN** the response is `400 Bad Request` and no field is created

#### Scenario: Adding a field to a non-existent form template
- **WHEN** an authenticated client calls `POST /api/v1/form-templates/:formTemplateId/fields` with a `formTemplateId` that does not exist
- **THEN** the response is `404 Not Found`

#### Scenario: Field with a valid condition is added
- **WHEN** an authenticated client calls `POST /api/v1/form-templates/:formTemplateId/fields` with a `condition` whose referenced field ids all belong to that form template, whose operators match each referenced field's `field_type`, and whose reference graph is acyclic
- **THEN** the response is `201 Created` with the new `FormTemplateField` including its `condition`

#### Scenario: Condition referencing a field from another form template is rejected
- **WHEN** an authenticated client calls `POST /api/v1/form-templates/:formTemplateId/fields` with a `condition` whose `field` id does not belong to that form template
- **THEN** the response is `400 Bad Request` and no field is created

#### Scenario: Condition with an operator invalid for the referenced field's type is rejected
- **WHEN** an authenticated client calls `POST /api/v1/form-templates/:formTemplateId/fields` with a `condition` leaf whose `operator` is not valid for the referenced field's `field_type` (e.g. `gt` on a `text` field), or whose `value` is not one of the referenced field's `options` where applicable
- **THEN** the response is `400 Bad Request` and no field is created

#### Scenario: Condition that would create a reference cycle is rejected
- **WHEN** an authenticated client calls `POST /api/v1/form-templates/:formTemplateId/fields` (or edits a field's condition) such that the resulting reference graph across the form template's fields contains a cycle
- **THEN** the response is `400 Bad Request` and the field/condition is not created or modified

### Requirement: Edit a template field
The backend SHALL expose `PATCH /api/v1/form-templates/:formTemplateId/fields/:fieldId`, requiring a valid session token, to update a field's `label`, `field_type`, `is_required`, `options`, and/or `condition`, applying the same `options` validation rules as field creation based on the field's resulting `field_type`, and the same `condition` validation rules as field creation (referenced fields belong to the same form template, operators match the referenced field's type, and the resulting reference graph stays acyclic) based on the field's resulting `condition`.

#### Scenario: Field is updated
- **WHEN** an authenticated client calls `PATCH /api/v1/form-templates/:formTemplateId/fields/:fieldId` with valid changes
- **THEN** the response is `200 OK` with the updated `FormTemplateField`

#### Scenario: Editing a non-existent field
- **WHEN** an authenticated client calls `PATCH /api/v1/form-templates/:formTemplateId/fields/:fieldId` with a `fieldId` that does not belong to `formTemplateId`
- **THEN** the response is `404 Not Found`

#### Scenario: Clearing a field's condition makes it always visible
- **WHEN** an authenticated client calls `PATCH /api/v1/form-templates/:formTemplateId/fields/:fieldId` with `condition` set to `null`
- **THEN** the response is `200 OK` and the field's `condition` is `null`

### Requirement: Remove a field from a form template
The backend SHALL expose `DELETE /api/v1/form-templates/:formTemplateId/fields/:fieldId`, requiring a valid session token, that permanently deletes the field, unless one or more other `FormTemplateField`s on the same form template have a `condition` referencing this field's id anywhere in their tree, in which case the deletion is rejected.

#### Scenario: Existing field is removed
- **WHEN** an authenticated client calls `DELETE /api/v1/form-templates/:formTemplateId/fields/:fieldId` for a field that belongs to that form template and is not referenced by any other field's `condition`
- **THEN** the response is `204 No Content` and the field no longer appears when the form template is fetched

#### Scenario: Removing a non-existent field
- **WHEN** an authenticated client calls `DELETE /api/v1/form-templates/:formTemplateId/fields/:fieldId` with a `fieldId` that does not belong to `formTemplateId`
- **THEN** the response is `404 Not Found`

#### Scenario: Removing a field referenced by another field's condition is rejected
- **WHEN** an authenticated client calls `DELETE /api/v1/form-templates/:formTemplateId/fields/:fieldId` for a field that one or more other fields' `condition` reference
- **THEN** the response is `400 Bad Request`, and the field and the referencing fields' conditions are unchanged

### Requirement: Frontend manages a form template's fields
The frontend SHALL provide a screen to edit a form template's `name`/`description` and manage its template fields: add a field (choosing `field_type`, `label`, `is_required`, `options` when applicable, and an optional visibility condition), edit an existing field, reorder fields via drag-and-drop, and remove a field. The condition editor SHALL let the user build an AND/OR tree of clauses, each choosing a trigger field (restricted to other fields on the same form template), an operator valid for that trigger field's `field_type`, and a value.

#### Scenario: Adding a field shows options input only when relevant
- **WHEN** a user selects `field_type` `select` or `multi_select` while adding or editing a field
- **THEN** the frontend shows an input for entering the field's `options`, and validates it is non-empty before allowing submission

#### Scenario: Reordering fields persists the new order
- **WHEN** a user drags a field to a new position in the field list
- **THEN** the frontend calls `PUT /api/v1/form-templates/:formTemplateId/fields/order` with the fields' new id order, and reflects the change immediately in the list

#### Scenario: Removing a field requires confirmation
- **WHEN** a user chooses to remove a field from the form template
- **THEN** the frontend shows a confirmation prompt before calling `DELETE /api/v1/form-templates/:formTemplateId/fields/:fieldId`

#### Scenario: Building a visibility condition for a field
- **WHEN** a user adds or edits a condition clause on a field, choosing a trigger field from the other fields on the same form template
- **THEN** the frontend restricts the operator choices to those valid for the trigger field's `field_type`, and lets the user group clauses with AND/OR, including nested groups

#### Scenario: Removing a field that other conditions depend on is blocked with an explanation
- **WHEN** a user attempts to remove a field that one or more other fields' conditions reference, and the backend rejects the deletion
- **THEN** the frontend shows an error explaining that other fields depend on it, and does not remove the field from the list
