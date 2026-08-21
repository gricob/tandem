## ADDED Requirements

### Requirement: Create a form type
The backend SHALL expose `POST /api/v1/form-types`, requiring a valid session token, that creates a `FormType` given a `name` (required, non-empty string) and an optional `description`.

#### Scenario: Valid form type is created
- **WHEN** an authenticated client calls `POST /api/v1/form-types` with a non-empty `name`
- **THEN** the response is `201 Created` with the new `FormType`, including a generated `id`, `created_at`, and `updated_at`, and no fields yet

#### Scenario: Missing name is rejected
- **WHEN** an authenticated client calls `POST /api/v1/form-types` without a `name` or with an empty `name`
- **THEN** the response is `400 Bad Request` and no `FormType` is created

### Requirement: List and view form types
The backend SHALL expose `GET /api/v1/form-types` (list, including each form type's fields) and `GET /api/v1/form-types/:formTypeId` (single form type with its fields, ordered by `order_index`), both requiring a valid session token.

#### Scenario: List returns all form types
- **WHEN** an authenticated client calls `GET /api/v1/form-types`
- **THEN** the response is `200 OK` with every existing `FormType`

#### Scenario: Fetching a single form type includes its fields in order
- **WHEN** an authenticated client calls `GET /api/v1/form-types/:formTypeId` for an existing form type
- **THEN** the response is `200 OK` with that `FormType` and its `FormField`s sorted by `order_index` ascending

#### Scenario: Fetching a non-existent form type
- **WHEN** an authenticated client calls `GET /api/v1/form-types/:formTypeId` with an id that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Edit a form type
The backend SHALL expose `PATCH /api/v1/form-types/:formTypeId`, requiring a valid session token, to update a form type's `name` and/or `description`.

#### Scenario: Name and description are updated
- **WHEN** an authenticated client calls `PATCH /api/v1/form-types/:formTypeId` with a new `name` and/or `description` for an existing form type
- **THEN** the response is `200 OK` with the updated `FormType` and its `updated_at` refreshed

#### Scenario: Clearing the name is rejected
- **WHEN** an authenticated client calls `PATCH /api/v1/form-types/:formTypeId` with an empty `name`
- **THEN** the response is `400 Bad Request` and the form type is not modified

### Requirement: Delete a form type
The backend SHALL expose `DELETE /api/v1/form-types/:formTypeId`, requiring a valid session token, that permanently deletes the `FormType` and all of its `FormField`s.

#### Scenario: Existing form type is deleted
- **WHEN** an authenticated client calls `DELETE /api/v1/form-types/:formTypeId` for an existing form type
- **THEN** the response is `204 No Content`, and the form type and its fields no longer appear in subsequent list or get requests

#### Scenario: Deleting a non-existent form type
- **WHEN** an authenticated client calls `DELETE /api/v1/form-types/:formTypeId` with an id that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Add a field to a form type
The backend SHALL expose `POST /api/v1/form-types/:formTypeId/fields`, requiring a valid session token, that creates a `FormField` on the given form type with `label` (required, non-empty), `field_type` (required, one of `text`, `textarea`, `number`, `boolean`, `select`, `multi_select`, `date`), `is_required` (boolean, defaults to `false`), and `options` (required non-empty array of strings when `field_type` is `select` or `multi_select`; must be omitted or null otherwise). New fields are appended after existing fields (highest `order_index` + 1).

#### Scenario: Valid field is added
- **WHEN** an authenticated client calls `POST /api/v1/form-types/:formTypeId/fields` with a valid `label` and `field_type`
- **THEN** the response is `201 Created` with the new `FormField`, appended after any existing fields on that form type

#### Scenario: Select field without options is rejected
- **WHEN** an authenticated client calls `POST /api/v1/form-types/:formTypeId/fields` with `field_type` set to `select` or `multi_select` and a missing or empty `options` array
- **THEN** the response is `400 Bad Request` and no field is created

#### Scenario: Non-select field with options is rejected
- **WHEN** an authenticated client calls `POST /api/v1/form-types/:formTypeId/fields` with `field_type` other than `select`/`multi_select` and a non-null `options` value
- **THEN** the response is `400 Bad Request` and no field is created

#### Scenario: Adding a field to a non-existent form type
- **WHEN** an authenticated client calls `POST /api/v1/form-types/:formTypeId/fields` with a `formTypeId` that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Edit a field
The backend SHALL expose `PATCH /api/v1/form-types/:formTypeId/fields/:fieldId`, requiring a valid session token, to update a field's `label`, `field_type`, `is_required`, and/or `options`, applying the same `options` validation rules as field creation based on the field's resulting `field_type`.

#### Scenario: Field is updated
- **WHEN** an authenticated client calls `PATCH /api/v1/form-types/:formTypeId/fields/:fieldId` with valid changes
- **THEN** the response is `200 OK` with the updated `FormField`

#### Scenario: Editing a non-existent field
- **WHEN** an authenticated client calls `PATCH /api/v1/form-types/:formTypeId/fields/:fieldId` with a `fieldId` that does not belong to `formTypeId`
- **THEN** the response is `404 Not Found`

### Requirement: Reorder fields within a form type
The backend SHALL expose `PUT /api/v1/form-types/:formTypeId/fields/order`, requiring a valid session token, that accepts an ordered array of that form type's field ids and rewrites each field's `order_index` to match its position in the array, in a single transaction.

#### Scenario: Fields are reordered
- **WHEN** an authenticated client calls `PUT /api/v1/form-types/:formTypeId/fields/order` with an array containing exactly the ids of all fields currently on that form type, in a new order
- **THEN** the response is `200 OK` and subsequent reads of that form type return its fields sorted by the new order

#### Scenario: Reorder payload omits or adds a field id
- **WHEN** an authenticated client calls `PUT /api/v1/form-types/:formTypeId/fields/order` with a list of ids that does not exactly match the set of field ids currently on that form type
- **THEN** the response is `400 Bad Request` and no `order_index` values are changed

### Requirement: Remove a field from a form type
The backend SHALL expose `DELETE /api/v1/form-types/:formTypeId/fields/:fieldId`, requiring a valid session token, that permanently deletes the field.

#### Scenario: Existing field is removed
- **WHEN** an authenticated client calls `DELETE /api/v1/form-types/:formTypeId/fields/:fieldId` for a field that belongs to that form type
- **THEN** the response is `204 No Content` and the field no longer appears when the form type is fetched

#### Scenario: Removing a non-existent field
- **WHEN** an authenticated client calls `DELETE /api/v1/form-types/:formTypeId/fields/:fieldId` with a `fieldId` that does not belong to `formTypeId`
- **THEN** the response is `404 Not Found`

### Requirement: Frontend lists, creates, and deletes form types
The frontend SHALL provide a screen listing all form types (name, description, field count) with actions to create a new form type and delete an existing one (after confirmation).

#### Scenario: Form types list loads
- **WHEN** a user navigates to the form types screen
- **THEN** the frontend fetches and displays all form types from `GET /api/v1/form-types`

#### Scenario: Creating a form type from the list screen
- **WHEN** a user submits the "new form type" form with a non-empty name
- **THEN** the frontend calls `POST /api/v1/form-types`, and on success navigates to that form type's edit screen

#### Scenario: Deleting a form type requires confirmation
- **WHEN** a user chooses to delete a form type from the list
- **THEN** the frontend shows a confirmation prompt before calling `DELETE /api/v1/form-types/:formTypeId`, and removes it from the list only after a successful response

### Requirement: Frontend manages a form type's fields
The frontend SHALL provide a screen to edit a form type's `name`/`description` and manage its fields: add a field (choosing `field_type`, `label`, `is_required`, and `options` when applicable), edit an existing field, reorder fields via drag-and-drop, and remove a field.

#### Scenario: Adding a field shows options input only when relevant
- **WHEN** a user selects `field_type` `select` or `multi_select` while adding or editing a field
- **THEN** the frontend shows an input for entering the field's `options`, and validates it is non-empty before allowing submission

#### Scenario: Reordering fields persists the new order
- **WHEN** a user drags a field to a new position in the field list
- **THEN** the frontend calls `PUT /api/v1/form-types/:formTypeId/fields/order` with the fields' new id order, and reflects the change immediately in the list

#### Scenario: Removing a field requires confirmation
- **WHEN** a user chooses to remove a field from the form type
- **THEN** the frontend shows a confirmation prompt before calling `DELETE /api/v1/form-types/:formTypeId/fields/:fieldId`
