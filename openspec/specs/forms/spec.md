# forms Specification

## Purpose

TBD - created by syncing change create-form. Update Purpose after archive.

## Requirements

### Requirement: Create a form
The backend SHALL expose `POST /api/v1/forms`, requiring a valid session token, that creates a `Form` given a `form_template_id` (required, must reference an existing `FormTemplate`), a `name` (required, non-empty string), and an optional `description`. On creation, the backend clones the referenced `FormTemplate`'s current `FormTemplateField`s into new `FormField`s owned by the new `Form`, preserving their `label`, `field_type`, `is_required`, `options`, `order_index`, and `condition`, each with a newly generated `id`. Any `field` id referenced anywhere inside a cloned field's `condition` tree is rewritten to the corresponding newly generated `FormField` id (using the same old-id-to-new-id mapping produced by the clone), so each `Form`'s conditions reference only its own `FormField`s.

#### Scenario: Valid form is created
- **WHEN** an authenticated client calls `POST /api/v1/forms` with a `form_template_id` referencing an existing `FormTemplate` and a non-empty `name`
- **THEN** the response is `201 Created` with the new `Form`, including a generated `id`, `created_at`, and `updated_at`

#### Scenario: Form fields are cloned from the template at creation
- **WHEN** an authenticated client calls `POST /api/v1/forms` with a `form_template_id` referencing a `FormTemplate` that has one or more `FormTemplateField`s
- **THEN** the new `Form` has its own `FormField`s matching the template fields' `label`, `field_type`, `is_required`, `options`, and order, each with an `id` distinct from the corresponding `FormTemplateField`'s `id`

#### Scenario: A cloned field's condition references the new form's own fields
- **WHEN** an authenticated client calls `POST /api/v1/forms` with a `form_template_id` referencing a `FormTemplate` that has a `FormTemplateField` whose `condition` references another `FormTemplateField` on the same template
- **THEN** the corresponding new `FormField`'s `condition` references the new `Form`'s own cloned `FormField` (not the original `FormTemplateField`), and evaluates equivalently to the source condition

#### Scenario: Missing name is rejected
- **WHEN** an authenticated client calls `POST /api/v1/forms` without a `name` or with an empty `name`
- **THEN** the response is `400 Bad Request` and no `Form` is created

#### Scenario: Non-existent form template is rejected
- **WHEN** an authenticated client calls `POST /api/v1/forms` with a `form_template_id` that does not reference an existing `FormTemplate`
- **THEN** the response is `400 Bad Request` and no `Form` is created

### Requirement: List and view forms
The backend SHALL expose `GET /api/v1/forms` (list, optionally filtered by a `name` query parameter matching case-insensitively on a substring, including each form's `form_template_id` and its form template's `name`) and `GET /api/v1/forms/:formId` (single form, including its own `FormField`s ordered by `order_index`), both requiring a valid session token. A form whose template has been deleted has a `null` `form_template_id` and `null` form template name.

#### Scenario: List returns all forms
- **WHEN** an authenticated client calls `GET /api/v1/forms` with no `name` parameter
- **THEN** the response is `200 OK` with every existing `Form`, each including its `form_template_id` and the referenced form template's `name` (or `null` for either if the form's template was deleted)

#### Scenario: List is filtered by name
- **WHEN** an authenticated client calls `GET /api/v1/forms?name=<substring>`
- **THEN** the response is `200 OK` with only the `Form`s whose `name` contains `<substring>`, case-insensitively

#### Scenario: Fetching a single form includes its own fields in order
- **WHEN** an authenticated client calls `GET /api/v1/forms/:formId` for an existing form
- **THEN** the response is `200 OK` with that `Form` and its own `FormField`s sorted by `order_index` ascending

#### Scenario: Fetching a non-existent form
- **WHEN** an authenticated client calls `GET /api/v1/forms/:formId` with an id that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Edit a form
The backend SHALL expose `PATCH /api/v1/forms/:formId`, requiring a valid session token, to update a form's `name` and/or `description`. The form's `form_template_id` and its own `FormField`s cannot be changed after creation.

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
The backend SHALL expose `DELETE /api/v1/forms/:formId`, requiring a valid session token, that permanently deletes the `Form` and its own `FormField`s. Its source `FormTemplate`, if any, is not affected. If the `Form` also backs a `UserStory` or an `AcceptanceCriterion`, deleting it also removes that `UserStory`/`AcceptanceCriterion`; if it backs a `UserStory`, all of that user story's `AcceptanceCriterion`s and their own backing `Form`s are removed too.

#### Scenario: Existing form is deleted
- **WHEN** an authenticated client calls `DELETE /api/v1/forms/:formId` for an existing form
- **THEN** the response is `204 No Content`, and the form no longer appears in subsequent list or get requests, while its source `FormTemplate` (if any) remains unchanged

#### Scenario: Deleting a non-existent form
- **WHEN** an authenticated client calls `DELETE /api/v1/forms/:formId` with an id that does not exist
- **THEN** the response is `404 Not Found`

#### Scenario: Deleting a form that backs a user story removes the user story and its acceptance criteria
- **WHEN** an authenticated client calls `DELETE /api/v1/forms/:formId` for a form that backs a `UserStory` with one or more `AcceptanceCriterion`s
- **THEN** the response is `204 No Content`, the `UserStory` no longer appears on its deliverable, and none of its former `AcceptanceCriterion`s (or their backing forms) are retrievable afterward

#### Scenario: Deleting a form that backs an acceptance criterion removes the acceptance criterion
- **WHEN** an authenticated client calls `DELETE /api/v1/forms/:formId` for a form that backs an `AcceptanceCriterion`
- **THEN** the response is `204 No Content` and that acceptance criterion no longer appears on its user story

### Requirement: Frontend lists, searches, creates, and deletes forms
The frontend SHALL provide a screen listing all forms (name, description, source form template name) with a name search input, an action to create a new form from an existing form template, and an action to delete an existing form (after confirmation). A form whose template was deleted SHALL display a fallback (e.g. "— deleted —") instead of a form template name.

#### Scenario: Forms list loads
- **WHEN** a user navigates to the forms screen
- **THEN** the frontend fetches and displays all forms from `GET /api/v1/forms`, showing each form's source form template name

#### Scenario: Searching forms by name
- **WHEN** a user types into the search input on the forms screen
- **THEN** the frontend calls `GET /api/v1/forms?name=<value>` and updates the list to the filtered results

#### Scenario: Creating a form from the list screen
- **WHEN** a user submits the "new form" form with a selected form template and a non-empty name
- **THEN** the frontend calls `POST /api/v1/forms`, and on success shows the new form in the list

#### Scenario: Deleting a form requires confirmation
- **WHEN** a user chooses to delete a form from the list
- **THEN** the frontend shows a confirmation prompt before calling `DELETE /api/v1/forms/:formId`, and removes it from the list only after a successful response

#### Scenario: A form with a deleted template shows a fallback
- **WHEN** a user views the forms list and one of the forms has a `null` form template name
- **THEN** the frontend shows a fallback label instead of a form template name for that form

### Requirement: Frontend edits a form
The frontend SHALL provide a way to edit an existing form's `name` and `description` (its source form template is fixed and shown read-only, or a fallback label if that template has since been deleted).

#### Scenario: Editing a form's name and description
- **WHEN** a user submits changes to a form's `name` and/or `description`
- **THEN** the frontend calls `PATCH /api/v1/forms/:formId` and reflects the updated values once the response succeeds

#### Scenario: Viewing a form whose template was deleted
- **WHEN** a user opens the edit screen for a form whose `form_template_id` is `null`
- **THEN** the frontend shows a fallback label (e.g. "— deleted —") in place of the form template name, and the rest of the screen behaves as usual
