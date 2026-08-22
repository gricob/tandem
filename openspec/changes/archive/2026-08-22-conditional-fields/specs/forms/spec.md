## MODIFIED Requirements

### Requirement: Create a form
The backend SHALL expose `POST /api/v1/forms`, requiring a valid session token, that creates a `Form` given a `form_template_id` (required, must reference an existing `FormTemplate`), a `name` (required, non-empty string), and an optional `description`. On creation, the backend clones the referenced `FormTemplate`'s current `FormTemplateField`s into new `FormField`s owned by the new `Form`, preserving their `label`, `field_type`, `is_required`, `options`, `order_index`, and `condition`, each with a newly generated `id`. Any `field` id referenced anywhere inside a cloned field's `condition` tree is rewritten to the corresponding newly generated `FormField` id (using the same old-id-to-new-id mapping produced by the clone), so each `Form`'s conditions reference only its own `FormField`s.

#### Scenario: Valid form is created
- **WHEN** an authenticated client calls `POST /api/v1/forms` with a `form_template_id` referencing an existing `FormTemplate` and a non-empty `name`
- **THEN** the response is `201 Created` with the new `Form`, including a generated `id`, `created_at`, and `updated_at`

#### Scenario: Form fields are cloned from the template at creation
- **WHEN** an authenticated client calls `POST /api/v1/forms` with a `form_template_id` referencing a `FormTemplate` that has one or more `FormTemplateField`s
- **THEN** the new `Form` has its own `FormField`s matching the template fields' `label`, `field_type`, `is_required`, `options`, and order, each with an `id` distinct from the corresponding `FormTemplateField`'s `id`

#### Scenario: A cloned field's condition references the new form's own fields
- **WHEN** an authenticated client calls `POST /api/v1/forms` with a `form_template_id` referencing a `FormTemplate` that has a `FormTemplateField` whose `condition` references another `FormTemplateField` on the same template
- **THEN** the corresponding new `FormField`'s `condition` references the new `Form`'s own cloned `FormField` (not the original `FormTemplateField`), and evaluates equivalently to the source condition

#### Scenario: Missing name is rejected
- **WHEN** an authenticated client calls `POST /api/v1/forms` without a `name` or with an empty `name`
- **THEN** the response is `400 Bad Request` and no `Form` is created

#### Scenario: Non-existent form template is rejected
- **WHEN** an authenticated client calls `POST /api/v1/forms` with a `form_template_id` that does not reference an existing `FormTemplate`
- **THEN** the response is `400 Bad Request` and no `Form` is created
