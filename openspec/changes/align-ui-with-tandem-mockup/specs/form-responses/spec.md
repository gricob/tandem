## REMOVED Requirements

### Requirement: Frontend fills in and saves a form's response
**Reason**: The dedicated, reachable-for-any-form-by-id fill-in screen
(`/forms/:formId/fill`) is retired along with the rest of the standalone
Forms feature. The underlying field-rendering, conditional-visibility, and
save behavior this requirement described is **not** removed from the
codebase — it continues to run, embedded rather than as its own screen, as
part of filling in a deliverable's user story and acceptance criterion
fields.
**Migration**: See the `deliverables` capability's "Frontend manages a
deliverable's user stories and their acceptance criteria" requirement, whose
scenarios for filling in a user story's or acceptance criterion's structured
fields now cover this behavior in its only remaining context.

The frontend SHALL provide a screen that dynamically renders a `Form`'s fields based on the `Form`'s own `FormField`s (using each field's `field_type`, `label`, `is_required`, `options`, and `condition`), lets the user enter or change values, and saves them via `PUT /api/v1/forms/:formId/response`. The screen SHALL work both for a form with no response yet and for re-opening a form to edit an already-saved response, pre-filling existing values. Fields whose `condition` does not currently evaluate to `true` against the in-progress values SHALL be hidden from the form, and the set of visible fields SHALL update immediately as the user changes a trigger field's value.

#### Scenario: Filling in a form with no prior response
- **WHEN** a user opens the fill-in screen for a form with no saved `FormResponse`
- **THEN** the frontend renders every field owned by the form empty, and calling `GET /api/v1/forms/:formId/response` returning `404` is treated as an empty starting state, not an error

#### Scenario: Saving entered values
- **WHEN** a user enters or changes one or more field values and triggers a save
- **THEN** the frontend calls `PUT /api/v1/forms/:formId/response` with the changed field values and reflects the save succeeding

#### Scenario: Re-opening a form pre-fills its saved answers
- **WHEN** a user opens the fill-in screen for a form that already has a `FormResponse`
- **THEN** the frontend fetches it via `GET /api/v1/forms/:formId/response` and pre-fills each field with its previously saved value

#### Scenario: Missing required fields are flagged without blocking a save
- **WHEN** a user saves a form leaving one or more `is_required` fields empty
- **THEN** the frontend still calls `PUT /api/v1/forms/:formId/response` and, using the returned `is_complete`, indicates to the user which required fields are still missing without preventing the partial save

#### Scenario: Changing a trigger field's value shows or hides dependent fields
- **WHEN** a user changes the value of a field that one or more other fields' `condition` reference
- **THEN** the frontend immediately re-evaluates and updates which of those dependent fields (and any fields depending on them transitively) are shown, without requiring a save round-trip

#### Scenario: A hidden field is not flagged as missing
- **WHEN** a user leaves the form with one or more `is_required` fields hidden because their `condition` is not currently met
- **THEN** the frontend does not flag those hidden fields as missing, consistent with the `is_complete` returned by the backend

### Requirement: Frontend views a form's response
**Reason**: The dedicated, reachable-for-any-form-by-id view screen
(`/forms/:formId/response`) is retired along with the rest of the standalone
Forms feature.
**Migration**: A deliverable's user stories and acceptance criteria display
their current field values inline (via the same `deliverables` capability
requirement referenced above) rather than through a separate view screen.

The frontend SHALL provide a screen showing the current `FormResponse` for a `Form` (its field values, labeled with each field's `label`, and whether it is complete), or an empty state with an entry point to fill it in if no response has been saved yet. The screen SHALL provide an entry point to edit the response. A field whose `condition` does not currently evaluate to `true` against the saved `response_data` SHALL NOT be displayed, even if `response_data` holds a stored value for it.

#### Scenario: Viewing a completed or partial response
- **WHEN** a user navigates to the response screen for a form that has a saved `FormResponse`
- **THEN** the frontend fetches it via `GET /api/v1/forms/:formId/response` and displays each answered, currently visible field's value labeled by its `FormField.label`, along with whether the response `is_complete`

#### Scenario: Viewing before any response was saved
- **WHEN** a user navigates to the response screen for a form with no saved `FormResponse`
- **THEN** the frontend shows an empty state instead of an error, with an action to go fill in the form

#### Scenario: Navigating from the response view to edit it
- **WHEN** a user chooses to edit the response from the response screen
- **THEN** the frontend navigates to the fill-in screen with the current values pre-filled

#### Scenario: A hidden field's stale value is not shown
- **WHEN** a user views a response where a field's `condition` currently evaluates to `false`, even though `response_data` holds a previously saved value for that field
- **THEN** the frontend does not display that field or its stored value
