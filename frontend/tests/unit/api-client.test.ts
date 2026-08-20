import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../../src/api/client';
import {
  clearSessionToken,
  getSessionToken,
  setSessionToken,
} from '../../src/features/auth/session-store';

describe('apiFetch', () => {
  beforeEach(() => {
    clearSessionToken();
  });

  afterEach(() => {
    clearSessionToken();
    vi.unstubAllGlobals();
  });

  it('attaches the stored session token as an Authorization header', async () => {
    setSessionToken('stored-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/api/v1/health');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer stored-token');
  });

  it('clears the stored session token when a request returns 401', async () => {
    setSessionToken('stale-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      }),
    );

    await expect(apiFetch('/api/v1/health')).rejects.toThrow();
    expect(getSessionToken()).toBeNull();
  });
});
