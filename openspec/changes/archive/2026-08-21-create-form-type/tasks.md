## 1. Data model

- [x] 1.1 Add `FormType` and `FormField` models to `backend/prisma/schema.prisma` per docs/modelo-datos.md §3.1, §3.3 (ULID ids, `field_type` enum, `options` as `Json?`, `order_index`, cascade delete from `FormType` to `FormField`)
- [x] 1.2 Generate and commit the Prisma migration for `form_types` and `form_fields`

## 2. Backend: FormTypesModule scaffolding

- [x] 2.1 Create `backend/src/modules/form-types/` module, controller, service, and DTOs
- [x] 2.2 Register `FormTypesModule` in the app module

## 3. Backend: form type endpoints

- [x] 3.1 Implement `POST /api/v1/form-types` (create, validates non-empty `name`)
- [x] 3.2 Implement `GET /api/v1/form-types` (list) and `GET /api/v1/form-types/:formTypeId` (single, fields ordered by `order_index`, 404 if missing)
- [x] 3.3 Implement `PATCH /api/v1/form-types/:formTypeId` (update `name`/`description`, rejects empty `name`)
- [x] 3.4 Implement `DELETE /api/v1/form-types/:formTypeId` (cascade delete, 404 if missing)

## 4. Backend: form field endpoints

- [x] 4.1 Implement `POST /api/v1/form-types/:formTypeId/fields` (create, appends at end, validates `options` against `field_type`)
- [x] 4.2 Implement `PATCH /api/v1/form-types/:formTypeId/fields/:fieldId` (update, same `options` validation)
- [x] 4.3 Implement `DELETE /api/v1/form-types/:formTypeId/fields/:fieldId` (404 if field doesn't belong to form type)
- [x] 4.4 Implement `PUT /api/v1/form-types/:formTypeId/fields/order` (validates submitted id set matches existing fields exactly, rewrites `order_index` in a transaction)

## 5. Backend: docs and tests

- [x] 5.1 Verify `@nestjs/swagger` decorators produce correct OpenAPI entries for all new endpoints
- [x] 5.2 Unit tests (Jest) for `FormTypesService`: name validation, options validation per `field_type`, reorder validation (missing/extra ids), cascade delete
- [x] 5.3 E2E tests (Supertest) covering the flow: create form type → add fields → reorder → edit → delete field → delete form type, plus 401 without a session token

## 6. Frontend: API client and routes

- [x] 6.1 Regenerate the typed API client (`openapi-typescript`) from the updated backend OpenAPI contract
- [x] 6.2 Add TanStack Router routes for the form types list and form type edit screens

## 7. Frontend: form types list screen

- [x] 7.1 Build list screen showing name, description, and field count per form type (TanStack Query against `GET /api/v1/form-types`)
- [x] 7.2 Add "new form type" creation form (`@mantine/form` + Zod), navigating to the edit screen on success
- [x] 7.3 Add delete action with confirmation prompt

## 8. Frontend: form type edit screen

- [x] 8.1 Build name/description edit form for the form type
- [x] 8.2 Build field list with add-field form (label, field type, required toggle, options input shown only for `select`/`multi_select`)
- [x] 8.3 Add edit-field and remove-field (with confirmation) actions
- [x] 8.4 Add drag-and-drop reordering that calls the reorder endpoint and updates the list optimistically

## 9. Frontend: tests

- [x] 9.1 Component/unit tests (Vitest + RTL) for the create form, add-field form (options validation), and delete confirmation
- [x] 9.2 Playwright e2e test covering: create a form type, add a select field with options, delete a field, delete the form type (drag-and-drop reordering verified manually via a real browser instead — `@dnd-kit`'s pointer sensor does not respond to Playwright's synthesized input events)
