## 1. Data model

- [x] 1.1 Add `UserStory` model to `backend/src/prisma/schema.prisma`: `id` (char(26), PK, also FK to `Form.id` with `onDelete: Cascade`), `deliverableId` (FK to `Deliverable`, `onDelete: Cascade`), `orderIndex`. Add the inverse `userStory` relation on `Form` and `userStories` relation on `Deliverable`.
- [x] 1.2 Add `Requirement` model the same way: `id` (PK, FK to `Form.id`, `onDelete: Cascade`), `userStoryId` (FK to `UserStory`, `onDelete: Cascade`), `orderIndex`. Add the inverse relations on `Form` and `UserStory`.
- [x] 1.3 Generate and review the Prisma migration for both new tables and relations.

## 2. Backend: shared form-creation helper

- [x] 2.1 Refactor `FormsService.createForm` to expose its template-field-cloning step as a reusable method (e.g. `buildCreateFormOperations(id, dto)` returning the Prisma operations for the `Form` + cloned `FormField`s), so it can be composed into a larger transaction without duplicating logic.

## 3. Backend: user stories (nested under deliverables)

- [x] 3.1 Add `CreateUserStoryDto` (`formTemplateId`, `name`, optional `description` — same shape as `CreateFormDto`).
- [x] 3.2 Add `UserStoryResponseDto` shaped like `FormResponseDto` plus `deliverableId`, `orderIndex`, and `requirements: RequirementResponseDto[]`.
- [x] 3.3 Create `UserStoriesModule`/`UserStoriesService`/`UserStoriesController` (routes prefixed `deliverables/:deliverableId/user-stories`). Implement `addUserStory`: validate the deliverable and form template exist, then in one transaction create the `Form` (+cloned fields) and the `UserStory` row (same id) with `order_index = max + 1` for that deliverable.
- [x] 3.4 Implement `removeUserStory`: in one transaction, delete the `Form`s backing all of that user story's requirements, then delete the `Form` backing the user story itself (id = userStoryId), relying on cascade to remove the wrapper rows. 404 if the user story doesn't exist on that deliverable.
- [x] 3.5 Implement `reorderUserStories`: validate the given id set exactly matches the deliverable's current user story ids (400 if not), then rewrite `order_index` for all of them in a single transaction.
- [x] 3.6 Add controller routes: `POST /:deliverableId/user-stories`, `DELETE /:deliverableId/user-stories/:userStoryId`, `PUT /:deliverableId/user-stories/order`, with Swagger decorators matching existing endpoints' style.

## 4. Backend: requirements (nested under user stories)

- [x] 4.1 Add `CreateRequirementDto` (same shape as `CreateUserStoryDto`).
- [x] 4.2 Add `RequirementResponseDto` shaped like `FormResponseDto` plus `userStoryId` and `orderIndex`.
- [x] 4.3 Add a controller (routes prefixed `user-stories/:userStoryId/requirements`) in `UserStoriesModule`. Implement `addRequirement`: validate the user story and form template exist, then in one transaction create the `Form` (+cloned fields) and the `Requirement` row (same id) with `order_index = max + 1` for that user story.
- [x] 4.4 Implement `removeRequirement`: delete the `Form` backing the requirement (id = requirementId), relying on cascade to remove the wrapper row. 404 if the requirement doesn't exist on that user story.
- [x] 4.5 Implement `reorderRequirements`: validate the given id set exactly matches the user story's current requirement ids (400 if not), then rewrite `order_index` for all of them in a single transaction.
- [x] 4.6 Add controller routes: `POST /:userStoryId/requirements`, `DELETE /:userStoryId/requirements/:requirementId`, `PUT /:userStoryId/requirements/order`.

## 5. Backend: deliverable responses and deletion

- [x] 5.1 Update `DeliverablesService.findAll`/`findOne` to include `userStories` (sorted by `order_index`), each including its `requirements` (sorted by `order_index`), each shaped like a form response.
- [x] 5.2 Update `DeliverableResponseDto` to include the `userStories` array.
- [x] 5.3 Update `DeliverablesService.deleteDeliverable` to, in one transaction, delete the `Form`s backing every requirement of every user story on the deliverable, then the `Form`s backing those user stories, then the deliverable itself — so nothing is left orphaned.

## 6. Backend tests

- [x] 6.1 Write/extend Supertest e2e tests covering: creating a user story (including invalid/missing template and name validation, 404 on missing deliverable), creating a requirement (same validations, 404 on missing user story), deleting a user story (removes its requirements and their forms, 404 on missing), deleting a requirement (404 on missing), reordering both levels (success and mismatched-id-set rejection), deliverable fetch responses including the full nested tree, and deleting a deliverable/form leaving nothing orphaned (per the MODIFIED `forms` "Delete a form" scenarios).

## 7. Frontend: API client and types

- [x] 7.1 Regenerate the typed OpenAPI client (`openapi-typescript`) after the backend contract changes, and add functions to `frontend/src/features/deliverables/api.ts` for create/delete/reorder user stories and requirements.

## 8. Frontend: deliverable edit screen

- [x] 8.1 Add a user stories section component under `frontend/src/features/deliverables/components/` displaying the deliverable's user stories in order, each with its requirements.
- [x] 8.2 Add a "new user story" flow that reuses the existing form-template picker (from the forms feature) plus a name/description input, calling create on submit.
- [x] 8.3 Reuse the existing form-filling UI (used for plain `Form`s) to display/edit a user story's or requirement's structured field values, wired to `PUT /forms/:formId/response`.
- [x] 8.4 Add drag-and-drop reordering for user stories, calling the reorder endpoint and reflecting the new order immediately.
- [x] 8.5 Add a "new requirement" flow within a user story, mirroring 8.2, and drag-and-drop reordering for requirements within a user story, mirroring 8.4.
- [x] 8.6 Add remove actions for both user stories and requirements.
- [x] 8.7 Wire the new section into `deliverable-edit-page.tsx`.
- [x] 8.8 Add editing of a user story's and a requirement's `name`/`description` on the deliverable edit screen, wired to `PATCH /forms/:formId` (they are forms).
- [x] 8.9 Make a user story's and a requirement's `name`/`description` read-only by default, switching to the editable form only after an explicit edit action, with Save/Cancel returning to read-only display.

## 9. Frontend tests

- [x] 9.1 Add/extend component tests (Vitest + React Testing Library) for adding, filling in, reordering, and removing a user story and a requirement on the deliverable edit screen.
- [x] 9.2 Add component tests for editing a user story's and a requirement's `name`/`description`.
- [x] 9.3 Add component tests for the read/edit toggle: read-only by default, edit mode on trigger, and Cancel discarding changes without a request.

## 10. Verification

- [x] 10.1 Run backend lint, typecheck, and test suite.
- [x] 10.2 Run frontend lint, typecheck, and test suite.
- [x] 10.3 Manually exercise the deliverable edit screen's user stories and requirements end to end, including deleting a deliverable that has both.

## 11. Rename: Requirement → AcceptanceCriterion

- [x] 11.1 Rename the Prisma model `Requirement` to `AcceptanceCriterion` (table `requirements` → `acceptance_criteria`, relation field `UserStory.requirements` → `UserStory.acceptanceCriteria`, `Form.requirement` → `Form.acceptanceCriterion`); generate and apply the migration (table was empty, safe drop+create).
- [x] 11.2 Rename backend module files/classes/routes: `requirements.controller/service.ts` → `acceptance-criteria.controller/service.ts`, `RequirementsController/Service` → `AcceptanceCriteriaController/Service`, DTOs (`CreateRequirementDto` → `CreateAcceptanceCriterionDto`, `RequirementResponseDto` → `AcceptanceCriterionResponseDto`, `ReorderRequirementsDto`/`requirementIds` → `ReorderAcceptanceCriteriaDto`/`acceptanceCriteriaIds`), route `/user-stories/:userStoryId/requirements` → `/user-stories/:userStoryId/acceptance-criteria`, param `:requirementId` → `:acceptanceCriterionId`. Update `UserStoriesService`/`UserStoriesModule`/`FormsService` (cascade-delete logic and comments) accordingly, and `UserStoryResponseDto.requirements` → `.acceptanceCriteria`.
- [x] 11.3 Rename backend tests: e2e spec file and its scenarios/routes/field names; `forms.service.spec.ts` mock (`prisma.requirement` → `prisma.acceptanceCriterion`).
- [x] 11.4 Regenerate the OpenAPI schema and frontend typed client; rename frontend `Requirement` type/`requirement-list.tsx` → `AcceptanceCriterion`/`acceptance-criteria-list.tsx`, api.ts functions, `queries.ts` hooks, and UI copy ("+ Requirement" → "+ Acceptance criterion", "Requirements" heading → "Acceptance Criteria", "No requirements yet." → "No acceptance criteria yet.").
- [x] 11.5 Rename frontend tests accordingly (`requirement-list.test.tsx` → `acceptance-criteria-list.test.tsx`, mocks and assertions updated) and update `create-templated-item-modal.test.tsx`'s requirement-flavored fixtures.
- [x] 11.6 Re-run backend and frontend lint/typecheck/test suites; manually verify the renamed flow in the browser.

## 12. Remove name/description from AcceptanceCriterion

- [x] 12.1 `CreateAcceptanceCriterionDto`: drop `name` and `description`, keeping only `formTemplateId`.
- [x] 12.2 `FormsService.buildCreateFormOperations`: make `name` optional in its input type and fall back to the source `FormTemplate`'s name when omitted, so `Form.name` (`NOT NULL`) stays satisfied without changing the `Form` schema or the `forms` capability.
- [x] 12.3 `AcceptanceCriterionResponseDto`: stop extending `FormResponseDto`; define its own shape omitting `name`/`description`. `AcceptanceCriteriaService.toAcceptanceCriterionResponse`: build the response explicitly without those two fields.
- [x] 12.4 Update the backend e2e spec: remove the "missing name" validation test for acceptance criteria, add a test asserting the created acceptance criterion has no `name`/`description` in its response, and strip `name` from all remaining acceptance-criterion create payloads.
- [x] 12.5 Regenerate the OpenAPI schema and frontend typed client. Split the frontend's shared creation modal: `create-templated-item-modal.tsx` → `create-user-story-modal.tsx` (unchanged: template + name + description) plus a new `create-acceptance-criterion-modal.tsx` (template picker only).
- [x] 12.6 Simplify `acceptance-criteria-list.tsx`: remove the name/description read/edit toggle, `useUpdateAcceptanceCriterionDetails`, and the now-unused `useUpdateAcceptanceCriterionDetails` query hook entirely; each row now shows its source form template's name as its label.
- [x] 12.7 Update frontend tests: rewrite `acceptance-criteria-list.test.tsx` (no more edit-mode tests), rename `create-templated-item-modal.test.tsx` → `create-user-story-modal.test.tsx`, and add `create-acceptance-criterion-modal.test.tsx`.
- [x] 12.8 Update the `deliverables` spec delta and `design.md`/`proposal.md` to reflect that `AcceptanceCriterion` has no `name`/`description`, is identified by its source template, and that its underlying form's name is auto-derived.
- [x] 12.9 Re-run backend and frontend lint/typecheck/test suites; manually verify creating/removing an acceptance criterion (no name/description prompt) in the browser.
