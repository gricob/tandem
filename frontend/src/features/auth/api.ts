import { apiFetch, type ApiPaths } from '../../api/client';

type LoginResponse =
  ApiPaths['/api/v1/auth/login']['post']['responses'][200]['content']['application/json'];

export function login(password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}
