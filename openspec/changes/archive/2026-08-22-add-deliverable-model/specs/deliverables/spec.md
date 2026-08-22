## ADDED Requirements

### Requirement: Create a deliverable
The backend SHALL expose `POST /api/v1/deliverables`, requiring a valid session token, that creates a `Deliverable` given a `name` (required, non-empty string) and an optional `description`.

#### Scenario: Valid deliverable is created
- **WHEN** an authenticated client calls `POST /api/v1/deliverables` with a non-empty `name`
- **THEN** the response is `201 Created` with the new `Deliverable`, including a generated `id`, `created_at`, and `updated_at`

#### Scenario: Missing name is rejected
- **WHEN** an authenticated client calls `POST /api/v1/deliverables` without a `name` or with an empty `name`
- **THEN** the response is `400 Bad Request` and no `Deliverable` is created

### Requirement: List and view deliverables
The backend SHALL expose `GET /api/v1/deliverables` (list of all deliverables) and `GET /api/v1/deliverables/:deliverableId` (single deliverable), both requiring a valid session token.

#### Scenario: List returns all deliverables
- **WHEN** an authenticated client calls `GET /api/v1/deliverables`
- **THEN** the response is `200 OK` with every existing `Deliverable`

#### Scenario: Fetching a single deliverable
- **WHEN** an authenticated client calls `GET /api/v1/deliverables/:deliverableId` for an existing deliverable
- **THEN** the response is `200 OK` with that `Deliverable`

#### Scenario: Fetching a non-existent deliverable
- **WHEN** an authenticated client calls `GET /api/v1/deliverables/:deliverableId` with an id that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Edit a deliverable
The backend SHALL expose `PATCH /api/v1/deliverables/:deliverableId`, requiring a valid session token, to update a deliverable's `name` and/or `description`.

#### Scenario: Name and description are updated
- **WHEN** an authenticated client calls `PATCH /api/v1/deliverables/:deliverableId` with a new `name` and/or `description` for an existing deliverable
- **THEN** the response is `200 OK` with the updated `Deliverable` and its `updated_at` refreshed

#### Scenario: Clearing the name is rejected
- **WHEN** an authenticated client calls `PATCH /api/v1/deliverables/:deliverableId` with an empty `name`
- **THEN** the response is `400 Bad Request` and the deliverable is not modified

#### Scenario: Editing a non-existent deliverable
- **WHEN** an authenticated client calls `PATCH /api/v1/deliverables/:deliverableId` with an id that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Delete a deliverable
The backend SHALL expose `DELETE /api/v1/deliverables/:deliverableId`, requiring a valid session token, that permanently deletes the `Deliverable`.

#### Scenario: Existing deliverable is deleted
- **WHEN** an authenticated client calls `DELETE /api/v1/deliverables/:deliverableId` for an existing deliverable
- **THEN** the response is `204 No Content`, and the deliverable no longer appears in subsequent list or get requests

#### Scenario: Deleting a non-existent deliverable
- **WHEN** an authenticated client calls `DELETE /api/v1/deliverables/:deliverableId` with an id that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Frontend lists, creates, and deletes deliverables
The frontend SHALL provide a screen listing all deliverables (name, description) with actions to create a new deliverable and delete an existing one (after confirmation).

#### Scenario: Deliverables list loads
- **WHEN** a user navigates to the deliverables screen
- **THEN** the frontend fetches and displays all deliverables from `GET /api/v1/deliverables`

#### Scenario: Creating a deliverable from the list screen
- **WHEN** a user submits the "new deliverable" form with a non-empty name
- **THEN** the frontend calls `POST /api/v1/deliverables`, and on success navigates to that deliverable's edit screen

#### Scenario: Deleting a deliverable requires confirmation
- **WHEN** a user chooses to delete a deliverable from the list
- **THEN** the frontend shows a confirmation prompt before calling `DELETE /api/v1/deliverables/:deliverableId`, and removes it from the list only after a successful response

### Requirement: Frontend edits a deliverable's name and description
The frontend SHALL provide a screen to edit an existing deliverable's `name` and `description`.

#### Scenario: Editing a deliverable persists changes
- **WHEN** a user updates the `name` and/or `description` fields on a deliverable's edit screen and submits
- **THEN** the frontend calls `PATCH /api/v1/deliverables/:deliverableId` and reflects the saved values on success

#### Scenario: Clearing the name is rejected client-side
- **WHEN** a user clears the `name` field on a deliverable's edit screen
- **THEN** the frontend blocks submission with a validation error before calling the backend
