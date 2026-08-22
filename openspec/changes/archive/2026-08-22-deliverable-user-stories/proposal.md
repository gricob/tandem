## Why

Deliverables currently only carry a `name` and `description`, with no way to capture the user stories that define what the deliverable actually needs to accomplish. Rather than free text, user stories need to hold structured data — built from the same reusable `FormTemplate`s already used elsewhere in the app — and each user story needs its own set of acceptance criteria, also built from form templates.

## What Changes

- Add `UserStory`, a structured child resource of `Deliverable`. Creating one works like creating a `Form`: pick a `FormTemplate`, give it a `name`/optional `description`; the template's fields are cloned onto it and its structured answers are filled in the same way any `Form`'s response is filled. A `UserStory` **is** its underlying `Form` (extends it, sharing its `id`), plus a `deliverableId` and an `order_index`.
- Add `AcceptanceCriterion`, a structured child resource of `UserStory` — created by picking a `FormTemplate`, also an extension of `Form` (sharing its `id`), plus a `userStoryId` and an `order_index`. Unlike a `UserStory`, it has no `name`/`description` of its own: it's identified only by its source form template, with its underlying form's `name` derived automatically from that template's name.
- Backend: nested endpoints to create, delete, and reorder a deliverable's user stories, and a user story's acceptance criteria, following the same nested-resource shape already used for `FormTemplateField`s under form templates. Filling in structured answers for either, and editing a user story's `name`/`description`, reuse the existing `PUT /api/v1/forms/:formId/response` and `PATCH /api/v1/forms/:formId` endpoints unchanged, since both are literally `Form`s.
- Deleting the `Form` behind a user story or acceptance criterion now also removes the user story/acceptance criterion (and, for a user story, its acceptance criteria and their forms) — a small behavior addition to the existing `forms` capability.
- `GET` endpoints for a deliverable now include its user stories (each with its acceptance criteria), sorted by `order_index`.
- Frontend: the deliverable edit screen gains a user stories section — add a user story by picking a form template (with a name/description), fill in its structured fields (reusing the existing form-filling UI), manage its acceptance criteria (added by picking a form template only, no name/description input), reorder both levels via drag-and-drop, and remove either.

## Capabilities

### New Capabilities
(none — this extends the existing `deliverables` and `forms` capabilities)

### Modified Capabilities
- `deliverables`: adds requirements for creating, deleting, and reordering a deliverable's user stories and a user story's acceptance criteria (backend endpoints and frontend UI), and extends the existing "list and view" requirements so fetched deliverables include their user stories (with nested acceptance criteria), each backed by a form template.
- `forms`: adds a requirement that deleting a `Form` which backs a `UserStory` or `AcceptanceCriterion` also removes that user story/acceptance criterion (cascading further for a user story's acceptance criteria and their forms).

## Impact

- Backend: `backend/src/prisma/schema.prisma` (new `UserStory` and `AcceptanceCriterion` models, each extending `Form` via a shared primary key; relations to `Deliverable` and `UserStory` respectively), new migration. New `UserStoriesModule` (or equivalent) for the nested create/delete/reorder routes, reusing `FormsService`'s template-cloning logic. `backend/src/modules/deliverables/` updated so deliverable responses embed `userStories`.
- Frontend: `frontend/src/features/deliverables/` (deliverable edit page gains a user stories section/components that reuse the existing form-template-picker and form-filling UI), regenerated typed API client from the updated OpenAPI contract.
- No breaking changes to existing `Deliverable` or `Form` create/edit/list endpoints; the deliverable response payload gains a new `userStories` array, and deleting a form gains a documented cascading side effect when that form backs a user story or acceptance criterion.
