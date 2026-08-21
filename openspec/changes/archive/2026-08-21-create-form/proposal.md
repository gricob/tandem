## Why

`FormType` and `FormField` exist, but there is still no way to create the `Form` itself — the concrete, shareable instance that will eventually receive a response. Without it, nothing built so far can be shared or filled in. This change adds `Form` as the second domain slice, unblocking the rest of the MVP (filling forms, viewing responses).

## What Changes

- Add backend `FormsModule` (Controller → Service → Prisma) exposing a REST API to create, read, update, delete, and list `Form` records, each created from an existing `FormType` and carrying its own `name` and optional `description`.
- Add `GET /api/v1/forms` support for filtering by name (case-insensitive partial match), covering the "search forms by name" user story.
- Add Prisma schema/migration for the `forms` table per docs/modelo-datos.md §3.2, §8.
- Add OpenAPI documentation for the new endpoints (used to regenerate the frontend's typed API client).
- Add frontend screens: list forms (with name search and each form's source form type), and create/edit a form (name, description, form type selection on create).
- All endpoints sit behind the existing shared-password `AuthGuard` — no new access-control model is introduced.

Out of scope for this change: `FormResponse` (filling out/answering a form, saving/reading response data) — a separate follow-up change, since it depends on `Form` existing first.

## Capabilities

### New Capabilities
- `forms`: create, edit, delete, list (with name search), and view `Form` records instantiated from a `FormType`.

### Modified Capabilities
(none — this introduces a new capability without changing existing spec behavior)

## Impact

- **Backend**: new `FormsModule` (controller, service, DTOs), Prisma schema changes + migration for `forms`, new OpenAPI paths.
- **Frontend**: new routes/pages for the forms list and form create/edit screens (in the existing `frontend/src/features/forms/` placeholder), regenerated typed API client from the updated OpenAPI contract.
- **Database**: new table `forms`, referencing `form_types` (see docs/modelo-datos.md §8).
- No changes to auth, deployment, or existing specs (`auth`, `project-scaffold`, `form-types`).
