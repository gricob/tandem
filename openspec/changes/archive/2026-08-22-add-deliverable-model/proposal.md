## Why

Tandem's domain currently only models forms (`FormTemplate`, `Form`, `FormResponse`). There is no way to record a deliverable — a piece of software that can be delivered — as its own entity. This change introduces `Deliverable` as a standalone record, independent of the forms domain, to lay the groundwork for future work that may reference it.

## What Changes

- Add a `Deliverable` model: `id`, `name` (required), `description` (optional), `created_at`, `updated_at`. No relations to any existing entity (standalone, mirroring the minimal shape of `FormTemplate`).
- Add a backend CRUD module exposing create, list, view, edit, and delete endpoints for deliverables, following the same `AuthGuard`-protected, Controller → Service → Prisma pattern used by every other module.
- Add a frontend feature: a list screen (name, description) with create and delete actions, and an edit screen for `name`/`description`.

## Capabilities

### New Capabilities
- `deliverables`: create, list, view, edit, and delete `Deliverable` records (backend API + frontend screens). No relation to forms or any other capability.

### Modified Capabilities
(none)

## Impact

- **Backend**: new `Deliverable` Prisma model + migration; new `deliverables` module (controller, service, DTOs) registered in the app module; new endpoints under `/api/v1/deliverables`, all requiring a valid session token like every other route.
- **Frontend**: new `deliverables` feature (list + edit pages, API client, TanStack Query hooks), a new route, and a navbar entry alongside Form Templates/Forms.
- **No changes** to `FormTemplate`, `Form`, `FormField`, or `FormResponse` — `Deliverable` has zero relations to them.
