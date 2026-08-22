## MODIFIED Requirements

### Requirement: Save a form's response
The backend SHALL expose `PUT /api/v1/forms/:formId/response`, requiring a valid session token, that upserts the `FormResponse` for the given `Form`: creates it on the first call and updates the same row on every subsequent call. The request body carries a `response_data` object mapping `field_id` to value; each key is merged into the stored `response_data`, leaving previously saved keys not present in the request untouched, and clearing a field when its value is explicitly `null`. Each submitted key must reference an existing `FormField` owned by the `Form` itself, and its value must match that field's `field_type` (string for `text`/`textarea`, number for `number`, boolean for `boolean`, one of the field's `options` for `select`, a subset of the field's `options` for `multi_select`, ISO date string for `date`). A response is never rejected for leaving `is_required` fields unanswered, and a value for a field whose `condition` does not currently evaluate to true (i.e. the field is currently hidden) is accepted and stored the same as any other field's value.

#### Scenario: First save creates the response
- **WHEN** an authenticated client calls `PUT /api/v1/forms/:formId/response` for a form with no existing `FormResponse`, with a `response_data` object containing values for one or more of its fields
- **THEN** the response is `200 OK` with the new `FormResponse`, including a generated `id`, the submitted `response_data`, `created_at`, `updated_at`, and `is_complete`

#### Scenario: Later save merges into the existing response
- **WHEN** an authenticated client calls `PUT /api/v1/forms/:formId/response` for a form that already has a `FormResponse`, with a `response_data` object containing only some of the form's field ids
- **THEN** the response is `200 OK`, the same `FormResponse` row is updated (no new row is created), previously saved values for field ids not present in this request are unchanged, and `updated_at` is refreshed

#### Scenario: Explicit null clears a field's value
- **WHEN** an authenticated client calls `PUT /api/v1/forms/:formId/response` with `null` as the value for a `field_id` that previously had a value
- **THEN** the response is `200 OK` and that field's value is removed from the stored `response_data`

#### Scenario: Saving with missing required fields is accepted
- **WHEN** an authenticated client calls `PUT /api/v1/forms/:formId/response` with a `response_data` object that leaves one or more `is_required` fields unanswered
- **THEN** the response is `200 OK`, the save succeeds, and the returned `is_complete` is `false`

#### Scenario: Unknown field id is rejected
- **WHEN** an authenticated client calls `PUT /api/v1/forms/:formId/response` with a `response_data` key that does not match any `FormField` owned by that `Form`
- **THEN** the response is `400 Bad Request` and the response is not modified

#### Scenario: Value shape mismatch is rejected
- **WHEN** an authenticated client calls `PUT /api/v1/forms/:formId/response` with a value for a field that does not match that field's `field_type` (e.g. a string for a `number` field, or a value outside `options` for a `select` field)
- **THEN** the response is `400 Bad Request` and the response is not modified

#### Scenario: Saving a response for a non-existent form
- **WHEN** an authenticated client calls `PUT /api/v1/forms/:formId/response` with a `formId` that does not exist
- **THEN** the response is `404 Not Found`

#### Scenario: A value for a currently hidden field is accepted
- **WHEN** an authenticated client calls `PUT /api/v1/forms/:formId/response` with a value for a `field_id` whose `condition` does not currently evaluate to true against the form's stored `response_data`
- **THEN** the response is `200 OK`, the value is stored, and the response is not rejected on account of the field being hidden

### Requirement: View a form's response
The backend SHALL expose `GET /api/v1/forms/:formId/response`, requiring a valid session token, that returns the `Form`'s `FormResponse` including its computed `is_complete`: whether every `is_required` `FormField` owned by the `Form` that is currently visible has a non-null value in `response_data`. A `FormField`'s visibility is `true` if it has no `condition`, or if its `condition` evaluates to `true` against the other fields' current effective values, where a hidden field's effective value is treated as absent (so hidden-ness propagates through fields that depend on other conditional fields). A hidden `is_required` field never blocks `is_complete`, regardless of whether `response_data` holds a stale value for it.

#### Scenario: Fetching an existing response
- **WHEN** an authenticated client calls `GET /api/v1/forms/:formId/response` for a form that has a saved `FormResponse`
- **THEN** the response is `200 OK` with that `FormResponse`, including `response_data` and `is_complete`

#### Scenario: Fetching before any response was saved
- **WHEN** an authenticated client calls `GET /api/v1/forms/:formId/response` for a form that has no saved `FormResponse` yet
- **THEN** the response is `404 Not Found`

#### Scenario: Fetching the response of a non-existent form
- **WHEN** an authenticated client calls `GET /api/v1/forms/:formId/response` with a `formId` that does not exist
- **THEN** the response is `404 Not Found`

#### Scenario: A hidden required field does not block completeness
- **WHEN** an authenticated client calls `GET /api/v1/forms/:formId/response` for a form where an `is_required` `FormField`'s `condition` currently evaluates to `false`
- **THEN** the response is `200 OK` and `is_complete` is computed without requiring a value for that hidden field

#### Scenario: A visible required field still blocks completeness
- **WHEN** an authenticated client calls `GET /api/v1/forms/:formId/response` for a form where an `is_required` `FormField` has no `condition`, or has a `condition` that currently evaluates to `true`, and has no value in `response_data`
- **THEN** the response is `200 OK` and `is_complete` is `false`

### Requirement: Frontend fills in and saves a form's response
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
