import { apiFetch, ApiError, type ApiPaths } from '../../api/client';

export type FormResponse =
  ApiPaths['/api/v1/forms/{formId}/response']['get']['responses'][200]['content']['application/json'];

type SaveFormResponseBody =
  ApiPaths['/api/v1/forms/{formId}/response']['put']['requestBody']['content']['application/json'];

export async function getFormResponse(
  formId: string,
): Promise<FormResponse | null> {
  try {
    return await apiFetch(`/api/v1/forms/${formId}/response`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function saveFormResponse(
  formId: string,
  body: SaveFormResponseBody,
): Promise<FormResponse> {
  return apiFetch(`/api/v1/forms/${formId}/response`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
