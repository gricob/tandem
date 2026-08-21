## 1. Schema

- [x] 1.1 In `backend/src/prisma/schema.prisma`, rename model `FormType` to `FormTemplate` (table `form_types` → `form_templates`)
- [x] 1.2 Rename the current `FormField` model to `FormTemplateField`, keeping its relation to `FormTemplate` (`form_template_id`, `onDelete: Cascade`, table `form_template_fields`)
- [x] 1.3 Add a new `FormField` model related to `Form` (`form_id`, `onDelete: Cascade`, table `form_fields`) with the same shape (`label`, `field_type`, `is_required`, `options`, `order_index`)
- [x] 1.4 On `Form`, rename `formTypeId`/`form_type_id` to `formTemplateId`/`form_template_id`, make it nullable, set `onDelete: SetNull`, and add the new `fields: FormField[]` relation
- [x] 1.5 Generate a fresh Prisma migration for these changes and regenerate the Prisma client

## 2. Backend: form-templates module (renamed from form-types)

- [x] 2.1 Rename `backend/src/modules/form-types/` to `backend/src/modules/form-templates/` (controller, service, module, DTOs, spec files), updating class/type names from `FormType(s)` to `FormTemplate(s)` and `FormField` to `FormTemplateField` throughout
- [x] 2.2 Update routes from `/form-types` to `/form-templates` (including the nested `/fields`, `/fields/:fieldId`, `/fields/order` routes) and the `@ApiTags` value
- [x] 2.3 Update `deleteFormTemplate` (renamed from `deleteFormType`) — confirm cascade delete of `FormTemplateField`s and rely on the schema's `onDelete: SetNull` to orphan referencing `Form`s (no service-level change needed beyond the rename, verify with a test)
- [x] 2.4 Update `AppModule` (or equivalent root module) to import `FormTemplatesModule` instead of `FormTypesModule`

## 3. Backend: forms module

- [x] 3.1 Update `CreateFormDto`/`UpdateFormDto` and related types: `formTypeId` → `formTemplateId`
- [x] 3.2 In `FormsService.createForm`, after validating the referenced `FormTemplate` exists, clone its current `FormTemplateField`s into new `FormField` rows owned by the new `Form` (new `id`s, same `label`/`field_type`/`is_required`/`options`/`order_index`), in the same transaction as the `Form` creation
- [x] 3.3 Update `FormsService` read paths (`findAllForms`, `getForm`) to include the form's own `fields` (ordered by `order_index`) and the referenced `formTemplate`'s `name` as nullable (`formTemplateName`)
- [x] 3.4 Update `toResponse`/response DTOs to expose `formTemplateId` (nullable), `formTemplateName` (nullable), and `fields`

## 4. Backend: form-responses module

- [x] 4.1 Update `FormResponsesService.getFormWithFields` (or equivalent) to read `form.fields` directly instead of joining through `formType`
- [x] 4.2 Update `saveResponse`/`getResponse` validation and `isComplete` computation to use the form's own `FormField`s
- [x] 4.3 Remove the now-unused `formType` include/type alias

## 5. Backend: tests

- [x] 5.1 Rename `backend/test/form-types.e2e-spec.ts` → `form-templates.e2e-spec.ts`, updating routes/entity names and the delete-orphans-forms behavior
- [x] 5.2 Update `backend/test/forms.e2e-spec.ts` for `formTemplateId`, field cloning on creation, and the nullable/orphaned template scenario
- [x] 5.3 Update `backend/test/form-responses.e2e-spec.ts` for validation against the form's own fields
- [x] 5.4 Update `form-types.service.spec.ts` → `form-templates.service.spec.ts`, `forms.service.spec.ts`, and `form-responses.service.spec.ts` unit tests accordingly

## 6. API contract and generated client

- [x] 6.1 Regenerate the OpenAPI contract from the backend
- [x] 6.2 Regenerate the frontend's typed API client (`openapi-typescript`) from the updated contract

## 7. Frontend: form-templates feature (renamed from form-types)

- [x] 7.1 Rename `frontend/src/features/form-types/` → `frontend/src/features/form-templates/` (api.ts, queries, schemas, components, pages), updating types/hooks from `FormType`/`FormField` to `FormTemplate`/`FormTemplateField`
- [x] 7.2 Update routes (`/form-types` → `/form-templates`) and all "form type" UI copy → "form template" (list page, edit page, field builder, confirm-delete modal)
- [x] 7.3 Update the delete-confirmation copy to note that forms already created from the template are unaffected

## 8. Frontend: forms feature

- [x] 8.1 Update `create-form-modal.tsx`: `formTypeId` → `formTemplateId`, "Form type" label → "Form template", sourced from the renamed form-templates queries
- [x] 8.2 Update `form-edit-page.tsx`: `formTypeName` → `formTemplateName`, "Form type" label → "Form template", with a fallback display (e.g. "— deleted —") when `formTemplateName` is `null`
- [x] 8.3 Update `forms-list-page.tsx`: column/label rename and the same fallback display for forms with a deleted template

## 9. Frontend: form-responses feature

- [x] 9.1 Update `form-response-fill-page.tsx` and `form-response-view-page.tsx` to source fields from the form's own `fields` instead of via its form type

## 10. Frontend: tests

- [x] 10.1 Rename/update `frontend/tests/unit/create-form-type-modal.test.tsx` → `create-form-template-modal.test.tsx` and `field-form.test.tsx` for the new naming
- [x] 10.2 Update `frontend/tests/unit/forms-list-page.test.tsx`, `forms-confirm-delete-modal.test.tsx`, `form-response-fill-page.test.tsx`, `form-responses-value-utils.test.ts` for the renamed fields/labels
- [x] 10.3 Rename/update `frontend/tests/e2e/form-types.spec.ts` → `form-templates.spec.ts`, and update `forms.spec.ts`/`form-responses.spec.ts` for the new routes and orphaned-template scenario

## 11. Docs

- [x] 11.1 Update `docs/modelo-datos.md`: entities (`FormTemplate`, `FormTemplateField`, `Form` with owned `FormField`s), relationships, and both diagrams (§6, §7) to match the new model
- [x] 11.2 Sweep `backend/src` and `frontend/src` (including tests) for any remaining `form-type`/`formType`/"form type" references and rename them

## 12. Verification

- [x] 12.1 Run backend lint, typecheck, and full test suite
- [x] 12.2 Run frontend lint, typecheck, and full test suite (unit + e2e)
- [x] 12.3 Manually exercise the flow in a running app: create a form template with fields, create a form from it, fill in and save a response, edit the template's fields and confirm the existing form/response is unaffected, delete the template and confirm the form still works with a fallback label
