import { apiFetch, type ApiPaths } from '../../api/client';

export type FormType =
  ApiPaths['/api/v1/form-types']['get']['responses'][200]['content']['application/json'][number];
export type FormField = FormType['fields'][number];
export type FieldType = FormField['fieldType'];

type CreateFormTypeBody =
  ApiPaths['/api/v1/form-types']['post']['requestBody']['content']['application/json'];
type UpdateFormTypeBody =
  ApiPaths['/api/v1/form-types/{formTypeId}']['patch']['requestBody']['content']['application/json'];
type CreateFormFieldBody =
  ApiPaths['/api/v1/form-types/{formTypeId}/fields']['post']['requestBody']['content']['application/json'];
type UpdateFormFieldBody =
  ApiPaths['/api/v1/form-types/{formTypeId}/fields/{fieldId}']['patch']['requestBody']['content']['application/json'];

export function listFormTypes(): Promise<FormType[]> {
  return apiFetch('/api/v1/form-types');
}

export function getFormType(formTypeId: string): Promise<FormType> {
  return apiFetch(`/api/v1/form-types/${formTypeId}`);
}

export function createFormType(body: CreateFormTypeBody): Promise<FormType> {
  return apiFetch('/api/v1/form-types', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateFormType(
  formTypeId: string,
  body: UpdateFormTypeBody,
): Promise<FormType> {
  return apiFetch(`/api/v1/form-types/${formTypeId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteFormType(formTypeId: string): Promise<void> {
  return apiFetch(`/api/v1/form-types/${formTypeId}`, { method: 'DELETE' });
}

export function addField(
  formTypeId: string,
  body: CreateFormFieldBody,
): Promise<FormField> {
  return apiFetch(`/api/v1/form-types/${formTypeId}/fields`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateField(
  formTypeId: string,
  fieldId: string,
  body: UpdateFormFieldBody,
): Promise<FormField> {
  return apiFetch(`/api/v1/form-types/${formTypeId}/fields/${fieldId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function removeField(
  formTypeId: string,
  fieldId: string,
): Promise<void> {
  return apiFetch(`/api/v1/form-types/${formTypeId}/fields/${fieldId}`, {
    method: 'DELETE',
  });
}

export function reorderFields(
  formTypeId: string,
  fieldIds: string[],
): Promise<FormType> {
  return apiFetch(`/api/v1/form-types/${formTypeId}/fields/order`, {
    method: 'PUT',
    body: JSON.stringify({ fieldIds }),
  });
}
