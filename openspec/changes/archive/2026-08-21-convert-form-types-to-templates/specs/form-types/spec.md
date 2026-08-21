## REMOVED Requirements

### Requirement: Create a form type
**Reason**: Superseded by `form-templates` (`POST /api/v1/form-templates`).
**Migration**: Use `POST /api/v1/form-templates` instead.

### Requirement: List and view form types
**Reason**: Superseded by `form-templates` (`GET /api/v1/form-templates`, `GET /api/v1/form-templates/:formTemplateId`).
**Migration**: Use the equivalent `form-templates` endpoints instead.

### Requirement: Edit a form type
**Reason**: Superseded by `form-templates` (`PATCH /api/v1/form-templates/:formTemplateId`).
**Migration**: Use `PATCH /api/v1/form-templates/:formTemplateId` instead.

### Requirement: Delete a form type
**Reason**: Superseded by `form-templates`. Deleting now also no longer cascade-deletes forms created from it — see `form-templates`' "Delete a form template".
**Migration**: Use `DELETE /api/v1/form-templates/:formTemplateId` instead.

### Requirement: Add a field to a form type
**Reason**: Superseded by `form-templates`' "Add a field to a form template" (`POST /api/v1/form-templates/:formTemplateId/fields`), which now creates a `FormTemplateField` rather than a `FormField`.
**Migration**: Use `POST /api/v1/form-templates/:formTemplateId/fields` instead.

### Requirement: Edit a field
**Reason**: Superseded by `form-templates`' "Edit a template field" (`PATCH /api/v1/form-templates/:formTemplateId/fields/:fieldId`).
**Migration**: Use `PATCH /api/v1/form-templates/:formTemplateId/fields/:fieldId` instead.

### Requirement: Reorder fields within a form type
**Reason**: Superseded by `form-templates`' "Reorder fields within a form template" (`PUT /api/v1/form-templates/:formTemplateId/fields/order`).
**Migration**: Use `PUT /api/v1/form-templates/:formTemplateId/fields/order` instead.

### Requirement: Remove a field from a form type
**Reason**: Superseded by `form-templates`' "Remove a field from a form template" (`DELETE /api/v1/form-templates/:formTemplateId/fields/:fieldId`).
**Migration**: Use `DELETE /api/v1/form-templates/:formTemplateId/fields/:fieldId` instead.

### Requirement: Frontend lists, creates, and deletes form types
**Reason**: Superseded by `form-templates`' equivalent frontend requirement, at the renamed form templates screen.
**Migration**: None needed; the form templates screen replaces it.

### Requirement: Frontend manages a form type's fields
**Reason**: Superseded by `form-templates`' "Frontend manages a form template's fields".
**Migration**: None needed; the form template edit screen replaces it.
