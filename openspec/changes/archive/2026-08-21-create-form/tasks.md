## 1. Data model

- [x] 1.1 Add `Form` model to `backend/src/prisma/schema.prisma` per docs/modelo-datos.md §3.2, §8 (ULID id, `form_type_id` FK to `FormType` with `onDelete: Cascade`, `name`, `description`)
- [x] 1.2 Generate and commit the Prisma migration for `forms`

## 2. Backend: FormsModule scaffolding

- [x] 2.1 Create `backend/src/modules/forms/` module, controller, service, and DTOs
- [x] 2.2 Register `FormsModule` in the app module

## 3. Backend: form endpoints

- [x] 3.1 Implement `POST /api/v1/forms` (create, validates non-empty `name` and that `form_type_id` references an existing `FormType`)
- [x] 3.2 Implement `GET /api/v1/forms` (list, optional `name` query param for case-insensitive substring filter, includes each form's form type `name`) and `GET /api/v1/forms/:formId` (single, 404 if missing)
- [x] 3.3 Implement `PATCH /api/v1/forms/:formId` (update `name`/`description` only, rejects empty `name`, 404 if missing)
- [x] 3.4 Implement `DELETE /api/v1/forms/:formId` (404 if missing)

## 4. Backend: docs and tests

- [x] 4.1 Verify `@nestjs/swagger` decorators produce correct OpenAPI entries for all new endpoints
- [x] 4.2 Unit tests (Jest) for `FormsService`: name validation, form_type_id existence validation, name search filtering
- [x] 4.3 E2E tests (Supertest) covering the flow: create form type → create form → list/search forms → get form → edit form → delete form, plus 401 without a session token

## 5. Frontend: API client and routes

- [x] 5.1 Regenerate the typed API client (`openapi-typescript`) from the updated backend OpenAPI contract
- [x] 5.2 Add TanStack Router routes for the forms list and form create/edit screens

## 6. Frontend: forms list screen

- [x] 6.1 Build list screen showing name, description, and source form type name per form (TanStack Query against `GET /api/v1/forms`)
- [x] 6.2 Add name search input that calls `GET /api/v1/forms?name=` and updates the list
- [x] 6.3 Add "new form" creation form (`@mantine/form` + Zod) with form type selection, navigating to the form on success
- [x] 6.4 Add delete action with confirmation prompt

## 7. Frontend: form edit screen

- [x] 7.1 Build name/description edit form for the form, with the source form type shown read-only

## 8. Frontend: tests

- [x] 8.1 Component/unit tests (Vitest + RTL) for the create form (including form type selection), search input, and delete confirmation
- [x] 8.2 Playwright e2e test covering: create a form type, create a form from it, search for it by name, edit its name, delete it
