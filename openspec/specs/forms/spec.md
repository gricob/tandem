# forms Specification

## Purpose

TBD - created by syncing change create-form. Update Purpose after archive.

## Requirements

### Requirement: Create a form
The backend SHALL expose `POST /api/v1/forms`, requiring a valid session token, that creates a `Form` given a `form_type_id` (required, must reference an existing `FormType`), a `name` (required, non-empty string), and an optional `description`.

#### Scenario: Valid form is created
- **WHEN** an authenticated client calls `POST /api/v1/forms` with a `form_type_id` referencing an existing `FormType` and a non-empty `name`
- **THEN** the response is `201 Created` with the new `Form`, including a generated `id`, `created_at`, and `updated_at`

#### Scenario: Missing name is rejected
- **WHEN** an authenticated client calls `POST /api/v1/forms` without a `name` or with an empty `name`
- **THEN** the response is `400 Bad Request` and no `Form` is created

#### Scenario: Non-existent form type is rejected
- **WHEN** an authenticated client calls `POST /api/v1/forms` with a `form_type_id` that does not reference an existing `FormType`
- **THEN** the response is `400 Bad Request` and no `Form` is created

### Requirement: List and view forms
The backend SHALL expose `GET /api/v1/forms` (list, optionally filtered by a `name` query parameter matching case-insensitively on a substring, including each form's `form_type_id` and its form type's `name`) and `GET /api/v1/forms/:formId` (single form), both requiring a valid session token.

#### Scenario: List returns all forms
- **WHEN** an authenticated client calls `GET /api/v1/forms` with no `name` parameter
- **THEN** the response is `200 OK` with every existing `Form`, each including its `form_type_id` and the referenced form type's `name`

#### Scenario: List is filtered by name
- **WHEN** an authenticated client calls `GET /api/v1/forms?name=<substring>`
- **THEN** the response is `200 OK` with only the `Form`s whose `name` contains `<substring>`, case-insensitively

#### Scenario: Fetching a single form
- **WHEN** an authenticated client calls `GET /api/v1/forms/:formId` for an existing form
- **THEN** the response is `200 OK` with that `Form`

#### Scenario: Fetching a non-existent form
- **WHEN** an authenticated client calls `GET /api/v1/forms/:formId` with an id that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Edit a form
The backend SHALL expose `PATCH /api/v1/forms/:formId`, requiring a valid session token, to update a form's `name` and/or `description`. The form's `form_type_id` cannot be changed after creation.

#### Scenario: Name and description are updated
- **WHEN** an authenticated client calls `PATCH /api/v1/forms/:formId` with a new `name` and/or `description` for an existing form
- **THEN** the response is `200 OK` with the updated `Form` and its `updated_at` refreshed

#### Scenario: Clearing the name is rejected
- **WHEN** an authenticated client calls `PATCH /api/v1/forms/:formId` with an empty `name`
- **THEN** the response is `400 Bad Request` and the form is not modified

#### Scenario: Editing a non-existent form
- **WHEN** an authenticated client calls `PATCH /api/v1/forms/:formId` with a `formId` that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Delete a form
The backend SHALL expose `DELETE /api/v1/forms/:formId`, requiring a valid session token, that permanently deletes the `Form`. Its source `FormType` is not affected.

#### Scenario: Existing form is deleted
- **WHEN** an authenticated client calls `DELETE /api/v1/forms/:formId` for an existing form
- **THEN** the response is `204 No Content`, and the form no longer appears in subsequent list or get requests, while its source `FormType` remains unchanged

#### Scenario: Deleting a non-existent form
- **WHEN** an authenticated client calls `DELETE /api/v1/forms/:formId` with an id that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Frontend lists, searches, creates, and deletes forms
The frontend SHALL provide a screen listing all forms (name, description, source form type name) with a name search input, an action to create a new form from an existing form type, and an action to delete an existing form (after confirmation).

#### Scenario: Forms list loads
- **WHEN** a user navigates to the forms screen
- **THEN** the frontend fetches and displays all forms from `GET /api/v1/forms`, showing each form's source form type name

#### Scenario: Searching forms by name
- **WHEN** a user types into the search input on the forms screen
- **THEN** the frontend calls `GET /api/v1/forms?name=<value>` and updates the list to the filtered results

#### Scenario: Creating a form from the list screen
- **WHEN** a user submits the "new form" form with a selected form type and a non-empty name
- **THEN** the frontend calls `POST /api/v1/forms`, and on success shows the new form in the list

#### Scenario: Deleting a form requires confirmation
- **WHEN** a user chooses to delete a form from the list
- **THEN** the frontend shows a confirmation prompt before calling `DELETE /api/v1/forms/:formId`, and removes it from the list only after a successful response

### Requirement: Frontend edits a form
The frontend SHALL provide a way to edit an existing form's `name` and `description` (its source form type is fixed and shown read-only).

#### Scenario: Editing a form's name and description
- **WHEN** a user submits changes to a form's `name` and/or `description`
- **THEN** the frontend calls `PATCH /api/v1/forms/:formId` and reflects the updated values once the response succeeds
