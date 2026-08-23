## ADDED Requirements

### Requirement: A deliverable belongs to a workstream
Every `Deliverable` SHALL belong to exactly one `Workstream` via a required `workstreamId`, set at creation time and carrying an `order_index` reflecting its position within that workstream. `workstreamId` is immutable after creation — `PATCH /api/v1/deliverables/:deliverableId` SHALL NOT change it.

#### Scenario: A deliverable's workstream is included in its representation
- **WHEN** an authenticated client fetches a `Deliverable` (individually or embedded in its workstream)
- **THEN** the response includes its `workstreamId` and `order_index`

#### Scenario: Attempting to change a deliverable's workstream via edit is ignored
- **WHEN** an authenticated client calls `PATCH /api/v1/deliverables/:deliverableId` with a `workstreamId` in the payload
- **THEN** the response is `200 OK` with the deliverable's `workstreamId` unchanged from before the request

## MODIFIED Requirements

### Requirement: List and view deliverables
The backend SHALL expose `GET /api/v1/deliverables/:deliverableId`, requiring a valid session token, to fetch a single deliverable. The response SHALL include its `userStories`, sorted by `order_index` ascending; each `UserStory` is shaped like a `Form` (name, description, source form template, fields, response) plus its `order_index`, and includes its own `acceptanceCriteria`, sorted by `order_index` ascending and shaped the same way. There is no flat "list all deliverables" endpoint — deliverables are listed via their workstream (`GET /api/v1/workstreams` and `GET /api/v1/workstreams/:workstreamId`).

#### Scenario: Fetching a single deliverable
- **WHEN** an authenticated client calls `GET /api/v1/deliverables/:deliverableId` for an existing deliverable
- **THEN** the response is `200 OK` with that `Deliverable`, including its `userStories` (with their `acceptanceCriteria`) sorted by `order_index`

#### Scenario: Fetching a non-existent deliverable
- **WHEN** an authenticated client calls `GET /api/v1/deliverables/:deliverableId` with an id that does not exist
- **THEN** the response is `404 Not Found`

## REMOVED Requirements

### Requirement: Create a deliverable
**Reason**: A `Deliverable` now requires a `workstreamId`, so creation must happen in the context of a workstream.
**Migration**: Use `POST /api/v1/workstreams/:workstreamId/deliverables` instead (see the `workstreams` capability).

### Requirement: Frontend lists, creates, and deletes deliverables
**Reason**: The flat, top-level deliverables list is superseded by workstreams as the primary organizing screen.
**Migration**: Use the workstreams list screen and a workstream's detail screen (add/reorder/remove deliverables) instead (see the `workstreams` capability). The deliverable edit screen itself (`/deliverables/$deliverableId`, for name/description and user stories/acceptance criteria) is unchanged.
