## MODIFIED Requirements

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
