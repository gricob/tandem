## REMOVED Requirements

### Requirement: Frontend lists, searches, creates, and deletes forms
**Reason**: The standalone Forms feature (browsing, searching, creating, and
deleting arbitrary ad-hoc forms) is retired from the frontend — it has no
counterpart in the adopted design and navigation, and was explicitly dropped
rather than restyled.
**Migration**: There is no frontend replacement; a `Form` is now only ever
created and managed implicitly, as the backing entity of a `UserStory` or
`AcceptanceCriterion` on a deliverable (see the `deliverables` capability).
The backend `POST/GET/DELETE /api/v1/forms` endpoints are unchanged and
remain reachable directly via the API.

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
**Reason**: Retired together with the standalone Forms list screen (see
above) — there is no longer any entry point to reach a standalone form's
edit screen.
**Migration**: A user story's or acceptance criterion's own name/description
editing (where applicable) is covered by the `deliverables` capability
instead.

The frontend SHALL provide a way to edit an existing form's `name` and `description` (its source form template is fixed and shown read-only, or a fallback label if that template has since been deleted).

#### Scenario: Editing a form's name and description
- **WHEN** a user submits changes to a form's `name` and/or `description`
- **THEN** the frontend calls `PATCH /api/v1/forms/:formId` and reflects the updated values once the response succeeds

#### Scenario: Viewing a form whose template was deleted
- **WHEN** a user opens the edit screen for a form whose `form_template_id` is `null`
- **THEN** the frontend shows a fallback label (e.g. "— deleted —") in place of the form template name, and the rest of the screen behaves as usual
