## ADDED Requirements

### Requirement: Create a workstream
The backend SHALL expose `POST /api/v1/workstreams`, requiring a valid session token, that creates a `Workstream` given a `name` (required, non-empty string) and an optional `description`.

#### Scenario: Valid workstream is created
- **WHEN** an authenticated client calls `POST /api/v1/workstreams` with a non-empty `name`
- **THEN** the response is `201 Created` with the new `Workstream`, including a generated `id`, `created_at`, and `updated_at`

#### Scenario: Missing name is rejected
- **WHEN** an authenticated client calls `POST /api/v1/workstreams` without a `name` or with an empty `name`
- **THEN** the response is `400 Bad Request` and no `Workstream` is created

### Requirement: List and view workstreams
The backend SHALL expose `GET /api/v1/workstreams` (list of all workstreams) and `GET /api/v1/workstreams/:workstreamId` (single workstream), both requiring a valid session token. Each returned `Workstream` SHALL include its `deliverables`, sorted by `order_index` ascending, each shaped exactly like the existing `Deliverable` representation (including its embedded `userStories` and their `acceptanceCriteria`).

#### Scenario: List returns all workstreams
- **WHEN** an authenticated client calls `GET /api/v1/workstreams`
- **THEN** the response is `200 OK` with every existing `Workstream`, each including its `deliverables` sorted by `order_index`

#### Scenario: Fetching a single workstream
- **WHEN** an authenticated client calls `GET /api/v1/workstreams/:workstreamId` for an existing workstream
- **THEN** the response is `200 OK` with that `Workstream`, including its `deliverables` sorted by `order_index`

#### Scenario: Fetching a non-existent workstream
- **WHEN** an authenticated client calls `GET /api/v1/workstreams/:workstreamId` with an id that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Edit a workstream
The backend SHALL expose `PATCH /api/v1/workstreams/:workstreamId`, requiring a valid session token, to update a workstream's `name` and/or `description`.

#### Scenario: Name and description are updated
- **WHEN** an authenticated client calls `PATCH /api/v1/workstreams/:workstreamId` with a new `name` and/or `description` for an existing workstream
- **THEN** the response is `200 OK` with the updated `Workstream` and its `updated_at` refreshed

#### Scenario: Clearing the name is rejected
- **WHEN** an authenticated client calls `PATCH /api/v1/workstreams/:workstreamId` with an empty `name`
- **THEN** the response is `400 Bad Request` and the workstream is not modified

#### Scenario: Editing a non-existent workstream
- **WHEN** an authenticated client calls `PATCH /api/v1/workstreams/:workstreamId` with an id that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Delete a workstream
The backend SHALL expose `DELETE /api/v1/workstreams/:workstreamId`, requiring a valid session token, that permanently deletes the `Workstream` along with all of its deliverables and everything beneath them (their user stories, acceptance criteria, and the forms backing both), leaving none of them orphaned or retrievable afterward.

#### Scenario: Existing workstream is deleted
- **WHEN** an authenticated client calls `DELETE /api/v1/workstreams/:workstreamId` for an existing workstream
- **THEN** the response is `204 No Content`, and the workstream no longer appears in subsequent list or get requests

#### Scenario: Deleting a non-existent workstream
- **WHEN** an authenticated client calls `DELETE /api/v1/workstreams/:workstreamId` with an id that does not exist
- **THEN** the response is `404 Not Found`

#### Scenario: Deleting a workstream with deliverables leaves nothing orphaned
- **WHEN** an authenticated client calls `DELETE /api/v1/workstreams/:workstreamId` for a workstream that has deliverables, some with user stories and acceptance criteria
- **THEN** the response is `204 No Content`, and none of its former deliverables, their user stories, acceptance criteria, or the forms backing any of them are retrievable afterward

### Requirement: Add a deliverable to a workstream
The backend SHALL expose `POST /api/v1/workstreams/:workstreamId/deliverables`, requiring a valid session token, that creates a `Deliverable` on the given workstream given a `name` (required, non-empty string) and an optional `description`. New deliverables are appended after existing ones on that workstream (highest `order_index` + 1).

#### Scenario: Valid deliverable is created on a workstream
- **WHEN** an authenticated client calls `POST /api/v1/workstreams/:workstreamId/deliverables` with a non-empty `name` for an existing workstream
- **THEN** the response is `201 Created` with the new `Deliverable`, including its `workstreamId` and an `order_index` one greater than the previous highest on that workstream

#### Scenario: Missing name is rejected
- **WHEN** an authenticated client calls `POST /api/v1/workstreams/:workstreamId/deliverables` without a `name` or with an empty `name`
- **THEN** the response is `400 Bad Request` and no `Deliverable` is created

#### Scenario: Adding a deliverable to a non-existent workstream
- **WHEN** an authenticated client calls `POST /api/v1/workstreams/:workstreamId/deliverables` with a `workstreamId` that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Reorder a workstream's deliverables
The backend SHALL expose `PUT /api/v1/workstreams/:workstreamId/deliverables/order`, requiring a valid session token, that accepts an ordered array of that workstream's deliverable ids and rewrites each one's `order_index` to match its position in the array, in a single transaction.

#### Scenario: Deliverables are reordered
- **WHEN** an authenticated client calls `PUT /api/v1/workstreams/:workstreamId/deliverables/order` with an array containing exactly the ids of all deliverables currently on that workstream, in a new order
- **THEN** the response is `200 OK` and subsequent fetches of that workstream return its `deliverables` in the new order

#### Scenario: Reorder payload omits or adds a deliverable id
- **WHEN** an authenticated client calls `PUT /api/v1/workstreams/:workstreamId/deliverables/order` with a list of ids that does not exactly match the set of deliverable ids currently on that workstream
- **THEN** the response is `400 Bad Request` and no `order_index` values are changed

### Requirement: Frontend lists, creates, and deletes workstreams
The frontend SHALL provide a screen listing all workstreams (name, description) with actions to create a new workstream and delete an existing one (after confirmation). This screen replaces the deliverables list screen as the primary navigation entry point.

#### Scenario: Workstreams list loads
- **WHEN** a user navigates to the workstreams screen
- **THEN** the frontend fetches and displays all workstreams from `GET /api/v1/workstreams`

#### Scenario: Creating a workstream from the list screen
- **WHEN** a user submits the "new workstream" form with a non-empty name
- **THEN** the frontend calls `POST /api/v1/workstreams`, and on success navigates to that workstream's detail screen

#### Scenario: Deleting a workstream requires confirmation
- **WHEN** a user chooses to delete a workstream from the list
- **THEN** the frontend shows a confirmation prompt before calling `DELETE /api/v1/workstreams/:workstreamId`, and removes it from the list only after a successful response

### Requirement: Frontend edits a workstream and manages its deliverables
The frontend SHALL provide a workstream detail screen to edit the workstream's `name`/`description`, and to add a deliverable (name/description), reorder deliverables via drag-and-drop, and remove a deliverable. Each listed deliverable SHALL link to its existing edit page for managing user stories and acceptance criteria.

#### Scenario: Editing a workstream persists changes
- **WHEN** a user updates the `name` and/or `description` fields on a workstream's detail screen and submits
- **THEN** the frontend calls `PATCH /api/v1/workstreams/:workstreamId` and reflects the saved values on success

#### Scenario: Adding a deliverable from the detail screen
- **WHEN** a user submits a name (and optional description) for a new deliverable on a workstream's detail screen
- **THEN** the frontend calls `POST /api/v1/workstreams/:workstreamId/deliverables` and adds it to the displayed list on success

#### Scenario: Reordering deliverables persists the new order
- **WHEN** a user drags a deliverable to a new position in the list
- **THEN** the frontend calls `PUT /api/v1/workstreams/:workstreamId/deliverables/order` with the deliverables' new id order, and reflects the change immediately in the list

#### Scenario: Removing a deliverable from the detail screen
- **WHEN** a user removes a deliverable from a workstream's detail screen
- **THEN** the frontend calls `DELETE /api/v1/deliverables/:deliverableId` and removes it, along with its user stories and acceptance criteria, from the displayed list on success

#### Scenario: Navigating to a deliverable's edit page
- **WHEN** a user selects a deliverable on a workstream's detail screen
- **THEN** the frontend navigates to that deliverable's existing edit page to manage its user stories and acceptance criteria
