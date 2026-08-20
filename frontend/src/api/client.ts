import { clearSessionToken, getSessionToken } from '../features/auth/session-store';
import type { paths } from './schema';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    clearSessionToken();
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `API request to ${path} failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export type ApiPaths = paths;
