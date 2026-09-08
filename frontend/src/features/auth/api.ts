import { apiFetch, type ApiPaths } from '../../api/client';

type LoginResponse =
  ApiPaths['/api/v1/auth/login']['post']['responses'][200]['content']['application/json'];

type RegisterResponse =
  ApiPaths['/api/v1/auth/register']['post']['responses'][200]['content']['application/json'];

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(params: {
  token: string;
  email: string;
  password: string;
  name: string;
}): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
