import { apiFetch, type ApiPaths } from '../../api/client';

export type Form =
  ApiPaths['/api/v1/forms']['get']['responses'][200]['content']['application/json'][number];

type CreateFormBody =
  ApiPaths['/api/v1/forms']['post']['requestBody']['content']['application/json'];
type UpdateFormBody =
  ApiPaths['/api/v1/forms/{formId}']['patch']['requestBody']['content']['application/json'];

export function listForms(name?: string): Promise<Form[]> {
  const query = name ? `?name=${encodeURIComponent(name)}` : '';
  return apiFetch(`/api/v1/forms${query}`);
}

export function getForm(formId: string): Promise<Form> {
  return apiFetch(`/api/v1/forms/${formId}`);
}

export function createForm(body: CreateFormBody): Promise<Form> {
  return apiFetch('/api/v1/forms', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateForm(
  formId: string,
  body: UpdateFormBody,
): Promise<Form> {
  return apiFetch(`/api/v1/forms/${formId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteForm(formId: string): Promise<void> {
  return apiFetch(`/api/v1/forms/${formId}`, { method: 'DELETE' });
}
