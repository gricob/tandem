import { apiFetch, type ApiPaths } from '../../api/client';

export type CurrentUser =
  ApiPaths['/api/v1/users/me']['get']['responses'][200]['content']['application/json'];

export function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch('/api/v1/users/me');
}
