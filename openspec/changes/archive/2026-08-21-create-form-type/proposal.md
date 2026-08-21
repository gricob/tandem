## Why

Tandem's core value is letting people define a reusable data-collection structure once and reuse it across forms. Right now there is no way to create that structure at all — the `FormType` and `FormField` entities exist only on paper (docs/modelo-datos.md). This change delivers the first slice of real product functionality: creating, editing, and deleting form types and the fields that define their structure.

## What Changes

- Add backend `FormTypesModule` (Controller → Service → Prisma) exposing a REST API to create, read, update, delete, and list `FormType` records, each with a name and optional description.
- Add `FormField` management nested under a `FormType`: create, edit, reorder (`order_index`), and delete fields, each with `label`, `field_type` (`text`, `textarea`, `number`, `boolean`, `select`, `multi_select`, `date`), `is_required`, and `options` (for `select`/`multi_select`).
- Add Prisma schema/migration for `form_types` and `form_fields` tables per docs/modelo-datos.md §3.1, §3.3, §8.
- Add OpenAPI documentation for the new endpoints (used to regenerate the frontend's typed API client).
- Add frontend screens: list form types, create/edit a form type (name + description), and manage its fields (add, edit, reorder, remove) with client-side validation (`@mantine/form` + Zod).
- All endpoints sit behind the existing shared-password `AuthGuard` — no new access-control model is introduced.

Out of scope for this change: `Form` (instances created from a `FormType`) and `FormResponse` (filling out/answering a form) — those are separate MVP capabilities to be proposed as follow-up changes.

## Capabilities

### New Capabilities
- `form-types`: create, edit, delete, list, and view `FormType` records, including managing their ordered `FormField` definitions (type, required flag, options, order).

### Modified Capabilities
(none — this introduces a new capability without changing existing spec behavior)

## Impact

- **Backend**: new `FormTypesModule` (controller, service, DTOs), Prisma schema changes + migration for `form_types`/`form_fields`, new OpenAPI paths.
- **Frontend**: new routes/pages for form type list, create/edit, and field management; regenerated typed API client from the updated OpenAPI contract.
- **Database**: new tables `form_types`, `form_fields` (see docs/modelo-datos.md §8).
- No changes to auth, deployment, or existing specs (`auth`, `project-scaffold`).
