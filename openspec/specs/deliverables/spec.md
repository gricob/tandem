# deliverables Specification

## Purpose

TBD - created by syncing change add-deliverable-model. Update Purpose after archive.

## Requirements

### Requirement: A deliverable belongs to a workstream
Every `Deliverable` SHALL belong to exactly one `Workstream` via a required `workstreamId`, set at creation time and carrying an `order_index` reflecting its position within that workstream. `workstreamId` is immutable after creation — `PATCH /api/v1/deliverables/:deliverableId` SHALL NOT change it.

#### Scenario: A deliverable's workstream is included in its representation
- **WHEN** an authenticated client fetches a `Deliverable` (individually or embedded in its workstream)
- **THEN** the response includes its `workstreamId` and `order_index`

#### Scenario: Attempting to change a deliverable's workstream via edit is ignored
- **WHEN** an authenticated client calls `PATCH /api/v1/deliverables/:deliverableId` with a `workstreamId` in the payload
- **THEN** the response is `200 OK` with the deliverable's `workstreamId` unchanged from before the request

### Requirement: List and view deliverables
The backend SHALL expose `GET /api/v1/deliverables/:deliverableId`, requiring a valid session token, to fetch a single deliverable. The response SHALL include its `userStories`, sorted by `order_index` ascending; each `UserStory` is shaped like a `Form` (name, description, source form template, fields, response) plus its `order_index`, and includes its own `acceptanceCriteria`, sorted by `order_index` ascending and shaped the same way. There is no flat "list all deliverables" endpoint — deliverables are listed via their workstream (`GET /api/v1/workstreams` and `GET /api/v1/workstreams/:workstreamId`).

#### Scenario: Fetching a single deliverable
- **WHEN** an authenticated client calls `GET /api/v1/deliverables/:deliverableId` for an existing deliverable
- **THEN** the response is `200 OK` with that `Deliverable`, including its `userStories` (with their `acceptanceCriteria`) sorted by `order_index`

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
The backend SHALL expose `DELETE /api/v1/deliverables/:deliverableId`, requiring a valid session token, that permanently deletes the `Deliverable` along with the forms backing all of its user stories and their acceptance criteria, leaving none of them orphaned or retrievable afterward.

#### Scenario: Existing deliverable is deleted
- **WHEN** an authenticated client calls `DELETE /api/v1/deliverables/:deliverableId` for an existing deliverable
- **THEN** the response is `204 No Content`, and the deliverable no longer appears in subsequent list or get requests

#### Scenario: Deleting a non-existent deliverable
- **WHEN** an authenticated client calls `DELETE /api/v1/deliverables/:deliverableId` with an id that does not exist
- **THEN** the response is `404 Not Found`

#### Scenario: Deleting a deliverable with user stories and acceptance criteria leaves nothing orphaned
- **WHEN** an authenticated client calls `DELETE /api/v1/deliverables/:deliverableId` for a deliverable that has user stories, some with acceptance criteria
- **THEN** the response is `204 No Content`, and none of its former user stories, their acceptance criteria, or the forms backing either are retrievable afterward

### Requirement: Frontend edits a deliverable's name and description
The frontend SHALL provide a screen to edit an existing deliverable's `name` and `description`.

#### Scenario: Editing a deliverable persists changes
- **WHEN** a user updates the `name` and/or `description` fields on a deliverable's edit screen and submits
- **THEN** the frontend calls `PATCH /api/v1/deliverables/:deliverableId` and reflects the saved values on success

#### Scenario: Clearing the name is rejected client-side
- **WHEN** a user clears the `name` field on a deliverable's edit screen
- **THEN** the frontend blocks submission with a validation error before calling the backend

### Requirement: Add a user story to a deliverable
The backend SHALL expose `POST /api/v1/deliverables/:deliverableId/user-stories`, requiring a valid session token, that creates a `UserStory` on the given deliverable given a `form_template_id` (required, must reference an existing `FormTemplate`), a `name` (required, non-empty string), and an optional `description`. A `UserStory` is an extension of `Form`: on creation, the backend clones the referenced `FormTemplate`'s current fields into new fields owned by the new user story, the same way creating a plain `Form` does. New user stories are appended after existing ones on that deliverable (highest `order_index` + 1).

#### Scenario: Valid user story is created
- **WHEN** an authenticated client calls `POST /api/v1/deliverables/:deliverableId/user-stories` with a valid `form_template_id` and non-empty `name` for an existing deliverable
- **THEN** the response is `201 Created` with the new `UserStory`, including its cloned fields, an `order_index` one greater than the previous highest on that deliverable, and no response data yet

#### Scenario: Missing or invalid form template is rejected
- **WHEN** an authenticated client calls `POST /api/v1/deliverables/:deliverableId/user-stories` without a `form_template_id` or with one that does not reference an existing `FormTemplate`
- **THEN** the response is `400 Bad Request` and no `UserStory` is created

#### Scenario: Missing name is rejected
- **WHEN** an authenticated client calls `POST /api/v1/deliverables/:deliverableId/user-stories` without a `name` or with an empty `name`
- **THEN** the response is `400 Bad Request` and no `UserStory` is created

#### Scenario: Adding a user story to a non-existent deliverable
- **WHEN** an authenticated client calls `POST /api/v1/deliverables/:deliverableId/user-stories` with a `deliverableId` that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Remove a user story from a deliverable
The backend SHALL expose `DELETE /api/v1/deliverables/:deliverableId/user-stories/:userStoryId`, requiring a valid session token, that permanently deletes that `UserStory`, its form, and all of its acceptance criteria together with their forms.

#### Scenario: Existing user story is deleted
- **WHEN** an authenticated client calls `DELETE /api/v1/deliverables/:deliverableId/user-stories/:userStoryId` for an existing user story
- **THEN** the response is `204 No Content`, and the user story no longer appears when fetching that deliverable

#### Scenario: Deleting a user story removes its acceptance criteria
- **WHEN** an authenticated client calls `DELETE /api/v1/deliverables/:deliverableId/user-stories/:userStoryId` for a user story that has acceptance criteria
- **THEN** the response is `204 No Content` and none of its former acceptance criteria (or their backing forms) are retrievable afterward

#### Scenario: Deleting a non-existent user story
- **WHEN** an authenticated client calls `DELETE /api/v1/deliverables/:deliverableId/user-stories/:userStoryId` with a `userStoryId` that does not exist on that deliverable
- **THEN** the response is `404 Not Found`

### Requirement: Reorder a deliverable's user stories
The backend SHALL expose `PUT /api/v1/deliverables/:deliverableId/user-stories/order`, requiring a valid session token, that accepts an ordered array of that deliverable's user story ids and rewrites each one's `order_index` to match its position in the array, in a single transaction.

#### Scenario: User stories are reordered
- **WHEN** an authenticated client calls `PUT /api/v1/deliverables/:deliverableId/user-stories/order` with an array containing exactly the ids of all user stories currently on that deliverable, in a new order
- **THEN** the response is `200 OK` and subsequent fetches of that deliverable return its `userStories` in the new order

#### Scenario: Reorder payload omits or adds a user story id
- **WHEN** an authenticated client calls `PUT /api/v1/deliverables/:deliverableId/user-stories/order` with a list of ids that does not exactly match the set of user story ids currently on that deliverable
- **THEN** the response is `400 Bad Request` and no `order_index` values are changed

### Requirement: Add an acceptance criterion to a user story
The backend SHALL expose `POST /api/v1/user-stories/:userStoryId/acceptance-criteria`, requiring a valid session token, that creates an `AcceptanceCriterion` on the given user story given only a `form_template_id` (required, must reference an existing `FormTemplate`). Unlike a `UserStory`, an `AcceptanceCriterion` has no `name` or `description` of its own: it is an extension of `Form`, created the same way a `UserStory` is, except the underlying form's `name` is derived automatically from the source `FormTemplate`'s name (since `Form.name` is required) and its `description` is left unset; neither is exposed on the `AcceptanceCriterion` representation. New acceptance criteria are appended after existing ones on that user story (highest `order_index` + 1).

#### Scenario: Valid acceptance criterion is created
- **WHEN** an authenticated client calls `POST /api/v1/user-stories/:userStoryId/acceptance-criteria` with a valid `form_template_id` for an existing user story
- **THEN** the response is `201 Created` with the new `AcceptanceCriterion` — no `name` or `description` field, its cloned fields, an `order_index` one greater than the previous highest on that user story, and no response data yet

#### Scenario: Missing or invalid form template is rejected
- **WHEN** an authenticated client calls `POST /api/v1/user-stories/:userStoryId/acceptance-criteria` without a `form_template_id` or with one that does not reference an existing `FormTemplate`
- **THEN** the response is `400 Bad Request` and no `AcceptanceCriterion` is created

#### Scenario: Adding an acceptance criterion to a non-existent user story
- **WHEN** an authenticated client calls `POST /api/v1/user-stories/:userStoryId/acceptance-criteria` with a `userStoryId` that does not exist
- **THEN** the response is `404 Not Found`

### Requirement: Remove an acceptance criterion from a user story
The backend SHALL expose `DELETE /api/v1/user-stories/:userStoryId/acceptance-criteria/:acceptanceCriterionId`, requiring a valid session token, that permanently deletes that `AcceptanceCriterion` and its form.

#### Scenario: Existing acceptance criterion is deleted
- **WHEN** an authenticated client calls `DELETE /api/v1/user-stories/:userStoryId/acceptance-criteria/:acceptanceCriterionId` for an existing acceptance criterion
- **THEN** the response is `204 No Content`, and the acceptance criterion no longer appears when fetching its user story's deliverable

#### Scenario: Deleting a non-existent acceptance criterion
- **WHEN** an authenticated client calls `DELETE /api/v1/user-stories/:userStoryId/acceptance-criteria/:acceptanceCriterionId` with an `acceptanceCriterionId` that does not exist on that user story
- **THEN** the response is `404 Not Found`

### Requirement: Reorder a user story's acceptance criteria
The backend SHALL expose `PUT /api/v1/user-stories/:userStoryId/acceptance-criteria/order`, requiring a valid session token, that accepts an ordered array of that user story's acceptance criterion ids and rewrites each one's `order_index` to match its position in the array, in a single transaction.

#### Scenario: Acceptance criteria are reordered
- **WHEN** an authenticated client calls `PUT /api/v1/user-stories/:userStoryId/acceptance-criteria/order` with an array containing exactly the ids of all acceptance criteria currently on that user story, in a new order
- **THEN** the response is `200 OK` and subsequent fetches of that user story's deliverable return its `acceptanceCriteria` in the new order

#### Scenario: Reorder payload omits or adds an acceptance criterion id
- **WHEN** an authenticated client calls `PUT /api/v1/user-stories/:userStoryId/acceptance-criteria/order` with a list of ids that does not exactly match the set of acceptance criterion ids currently on that user story
- **THEN** the response is `400 Bad Request` and no `order_index` values are changed

### Requirement: Frontend manages a deliverable's user stories and their acceptance criteria
The frontend SHALL provide, on the deliverable edit screen, a user stories section to add a user story by picking a form template (name, description, and template selection), display its `name`/`description` read-only until an edit action is triggered, fill in and edit its structured fields (reusing the existing form-filling UI), reorder user stories via drag-and-drop, remove a user story, and — within each user story — add an acceptance criterion by picking only a form template (no name/description input, since an `AcceptanceCriterion` has neither), identify it by its source template's name, fill in/edit its structured fields the same way, reorder acceptance criteria via drag-and-drop, and remove an acceptance criterion.

#### Scenario: Adding a user story from the edit screen
- **WHEN** a user picks a form template and submits a name for a new user story on a deliverable's edit screen
- **THEN** the frontend calls `POST /api/v1/deliverables/:deliverableId/user-stories` and adds it to the displayed list on success

#### Scenario: A user story's name and description start read-only
- **WHEN** a user story is displayed on a deliverable's edit screen
- **THEN** its `name` and `description` are shown as read-only text with an edit action, not as editable inputs

#### Scenario: Editing a user story's name or description
- **WHEN** a user triggers the edit action on a user story, changes its `name` and/or `description`, and saves
- **THEN** the frontend calls `PATCH /api/v1/forms/:formId` for that user story's underlying form, reflects the saved values on success, and returns to read-only display

#### Scenario: Cancelling a user story's name/description edit
- **WHEN** a user triggers the edit action on a user story, changes its `name` and/or `description`, and cancels instead of saving
- **THEN** the frontend discards the change, makes no request, and returns to read-only display showing the original values

#### Scenario: Filling in a user story's structured fields
- **WHEN** a user fills in or edits a user story's field values on a deliverable's edit screen
- **THEN** the frontend calls `PUT /api/v1/forms/:formId/response` for that user story's underlying form and reflects the saved values on success

#### Scenario: Reordering user stories persists the new order
- **WHEN** a user drags a user story to a new position in the list
- **THEN** the frontend calls `PUT /api/v1/deliverables/:deliverableId/user-stories/order` with the stories' new id order, and reflects the change immediately in the list

#### Scenario: Removing a user story from the edit screen
- **WHEN** a user removes a user story from a deliverable's edit screen
- **THEN** the frontend calls `DELETE /api/v1/deliverables/:deliverableId/user-stories/:userStoryId` and removes it, along with its acceptance criteria, from the displayed list on success

#### Scenario: Adding an acceptance criterion to a user story
- **WHEN** a user picks a form template for a new acceptance criterion on one of a deliverable's user stories
- **THEN** the frontend calls `POST /api/v1/user-stories/:userStoryId/acceptance-criteria` with just the chosen `form_template_id` and adds it to that user story's displayed acceptance criteria on success

#### Scenario: An acceptance criterion is identified by its source template
- **WHEN** an acceptance criterion is displayed on a deliverable's edit screen
- **THEN** it shows its source form template's name, with no editable or displayed `name`/`description` fields of its own

#### Scenario: Reordering a user story's acceptance criteria persists the new order
- **WHEN** a user drags an acceptance criterion to a new position within its user story's acceptance criteria list
- **THEN** the frontend calls `PUT /api/v1/user-stories/:userStoryId/acceptance-criteria/order` with the acceptance criteria's new id order, and reflects the change immediately

#### Scenario: Removing an acceptance criterion from a user story
- **WHEN** a user removes an acceptance criterion from one of a deliverable's user stories
- **THEN** the frontend calls `DELETE /api/v1/user-stories/:userStoryId/acceptance-criteria/:acceptanceCriterionId` and removes it from the displayed list on success
