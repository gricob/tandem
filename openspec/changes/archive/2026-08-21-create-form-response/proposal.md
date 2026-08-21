## Why

`FormType` and `Form` exist, but a shared `Form` still cannot be filled in or reviewed — there is no way to save, edit, or view the single `FormResponse` it is meant to receive. This is the last domain slice needed to close the MVP loop described in docs/prd.md §9: create a form, share it, fill it in, and consult the answer.

## What Changes

- Add backend `FormResponsesModule` (Controller → Service → Prisma) exposing `PUT /api/v1/forms/:formId/response` as an upsert: creates the `FormResponse` on first save, updates the same row on every subsequent save, storing `response_data` as JSON keyed by `field_id`.
- Add `GET /api/v1/forms/:formId/response` to fetch the current response for a form (or an empty/absent result if none has been saved yet).
- Validate `response_data` against the form's `FormType` fields in the application layer: reject values for unknown `field_id`s or of the wrong shape for the field's `field_type`, but never block a save for missing `is_required` fields — incompleteness is reported, not rejected.
- Compute and return whether the response is complete (every `is_required` field has a value), so the frontend can show completion state without recomputing the rule itself.
- Add Prisma schema/migration for the `form_responses` table per docs/modelo-datos.md §3.4, §8, with a unique constraint on `form_id`.
- Add OpenAPI documentation for the new endpoints and regenerate the frontend's typed API client.
- Add frontend fill-in screen: dynamically render the `Form`'s fields per `FormField.field_type`, save incrementally, and support re-opening the form to edit an already-saved response.
- Add frontend response view screen: show the current `FormResponse` for a `Form` (or an empty state if none exists yet), with an entry point to edit it.
- All endpoints sit behind the existing shared-password `AuthGuard` — no new access-control model is introduced.

## Capabilities

### New Capabilities
- `form-responses`: save (upsert, incremental), fetch, and view the single `FormResponse` belonging to a `Form`, including whether it is complete.

### Modified Capabilities
(none — this introduces a new capability without changing existing spec behavior for `forms` or `form-types`)

## Impact

- **Backend**: new `FormResponsesModule` (controller, service, DTOs), Prisma schema changes + migration for `form_responses`, new OpenAPI paths.
- **Frontend**: new routes/pages for filling in a form and viewing its response (in `frontend/src/features/form-responses/`), regenerated typed API client from the updated OpenAPI contract.
- **Database**: new table `form_responses`, referencing `forms` with a unique `form_id` (see docs/modelo-datos.md §8).
- No changes to auth, deployment, or existing specs (`auth`, `project-scaffold`, `form-types`, `forms`).
