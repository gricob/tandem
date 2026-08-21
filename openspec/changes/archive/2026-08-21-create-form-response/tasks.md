## 1. Data model

- [x] 1.1 Add `FormResponse` model to `backend/src/prisma/schema.prisma` per docs/modelo-datos.md §3.4, §8 (ULID id, `form_id` FK to `Form` with a unique constraint and `onDelete: Cascade`, `response_data` as JSONB)
- [x] 1.2 Generate and commit the Prisma migration for `form_responses`

## 2. Backend: FormResponsesModule scaffolding

- [x] 2.1 Create `backend/src/modules/form-responses/` module, controller, service, and DTOs
- [x] 2.2 Register `FormResponsesModule` in the app module

## 3. Backend: response validation and completeness

- [x] 3.1 Implement `response_data` validation against the form's `FormType` fields: reject unknown `field_id` keys and values whose shape doesn't match the field's `field_type` (string, number, boolean, one-of-`options`, subset-of-`options`, ISO date)
- [x] 3.2 Implement `is_complete` computation: every `is_required` field on the form's `FormType` has a non-null value in the stored `response_data`

## 4. Backend: response endpoints

- [x] 4.1 Implement `PUT /api/v1/forms/:formId/response` (upsert: creates on first call, updates on later calls; merges submitted `response_data` keys into the stored value, clearing a key when its value is `null`; 404 if the form doesn't exist)
- [x] 4.2 Implement `GET /api/v1/forms/:formId/response` (returns the `FormResponse` with `is_complete`; 404 if the form doesn't exist or has no saved response yet)

## 5. Backend: docs and tests

- [x] 5.1 Verify `@nestjs/swagger` decorators produce correct OpenAPI entries for both new endpoints
- [x] 5.2 Unit tests (Jest) for `FormResponsesService`: field-id validation, per-`field_type` value shape validation, merge semantics (including clearing via `null`), `is_complete` computation
- [x] 5.3 E2E tests (Supertest) covering the flow: create form type with required and optional fields → create form → save partial response → get response (incomplete) → save remaining fields → get response (complete) → clear a field → get response, plus 400 for unknown field id/shape mismatch, 404 for non-existent form and for no response yet, and 401 without a session token

## 6. Frontend: API client and routes

- [x] 6.1 Regenerate the typed API client (`openapi-typescript`) from the updated backend OpenAPI contract
- [x] 6.2 Add TanStack Router routes for the fill-in screen and the response view screen, under `frontend/src/features/form-responses/`

## 7. Frontend: fill-in screen

- [x] 7.1 Build dynamic field renderer mapping each `FormField.field_type` to a Mantine input (`text`/`textarea`/`number`/`boolean`/`select`/`multi_select`/`date`), driven by `@mantine/form`
- [x] 7.2 Pre-fill fields from `GET /api/v1/forms/:formId/response`, treating a `404` as an empty starting state rather than an error
- [x] 7.3 Wire saving to `PUT /api/v1/forms/:formId/response`, sending only changed field values
- [x] 7.4 Show which `is_required` fields are still missing using the returned `is_complete`/`response_data`, without blocking a partial save

## 8. Frontend: response view screen

- [x] 8.1 Build response view showing each answered field's value labeled by its `FormField.label`, and whether the response `is_complete`
- [x] 8.2 Add an empty state (with an action to go fill in the form) when `GET /api/v1/forms/:formId/response` returns `404`
- [x] 8.3 Add an action to navigate from the response view to the fill-in screen with current values pre-filled

## 9. Frontend: tests

- [x] 9.1 Component/unit tests (Vitest + RTL) for the dynamic field renderer (per `field_type`), incremental save, and the missing-required-fields indicator
- [x] 9.2 Playwright e2e test covering: create a form type with a required field, create a form from it, save a partial response, view it as incomplete, complete it, view it as complete, edit it again
