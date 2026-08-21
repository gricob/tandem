import { apiFetch, type ApiPaths } from '../../api/client';

export type FormTemplate =
  ApiPaths['/api/v1/form-templates']['get']['responses'][200]['content']['application/json'][number];
export type FormTemplateField = FormTemplate['templateFields'][number];
export type FieldType = FormTemplateField['fieldType'];

type CreateFormTemplateBody =
  ApiPaths['/api/v1/form-templates']['post']['requestBody']['content']['application/json'];
type UpdateFormTemplateBody =
  ApiPaths['/api/v1/form-templates/{formTemplateId}']['patch']['requestBody']['content']['application/json'];
type CreateFormTemplateFieldBody =
  ApiPaths['/api/v1/form-templates/{formTemplateId}/fields']['post']['requestBody']['content']['application/json'];
type UpdateFormTemplateFieldBody =
  ApiPaths['/api/v1/form-templates/{formTemplateId}/fields/{fieldId}']['patch']['requestBody']['content']['application/json'];

export function listFormTemplates(): Promise<FormTemplate[]> {
  return apiFetch('/api/v1/form-templates');
}

export function getFormTemplate(formTemplateId: string): Promise<FormTemplate> {
  return apiFetch(`/api/v1/form-templates/${formTemplateId}`);
}

export function createFormTemplate(
  body: CreateFormTemplateBody,
): Promise<FormTemplate> {
  return apiFetch('/api/v1/form-templates', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateFormTemplate(
  formTemplateId: string,
  body: UpdateFormTemplateBody,
): Promise<FormTemplate> {
  return apiFetch(`/api/v1/form-templates/${formTemplateId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteFormTemplate(formTemplateId: string): Promise<void> {
  return apiFetch(`/api/v1/form-templates/${formTemplateId}`, {
    method: 'DELETE',
  });
}

export function addField(
  formTemplateId: string,
  body: CreateFormTemplateFieldBody,
): Promise<FormTemplateField> {
  return apiFetch(`/api/v1/form-templates/${formTemplateId}/fields`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateField(
  formTemplateId: string,
  fieldId: string,
  body: UpdateFormTemplateFieldBody,
): Promise<FormTemplateField> {
  return apiFetch(`/api/v1/form-templates/${formTemplateId}/fields/${fieldId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function removeField(
  formTemplateId: string,
  fieldId: string,
): Promise<void> {
  return apiFetch(`/api/v1/form-templates/${formTemplateId}/fields/${fieldId}`, {
    method: 'DELETE',
  });
}

export function reorderFields(
  formTemplateId: string,
  fieldIds: string[],
): Promise<FormTemplate> {
  return apiFetch(`/api/v1/form-templates/${formTemplateId}/fields/order`, {
    method: 'PUT',
    body: JSON.stringify({ fieldIds }),
  });
}
