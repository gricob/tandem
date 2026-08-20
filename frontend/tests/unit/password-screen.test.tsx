import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordScreen } from '../../src/features/auth/password-screen';
import { clearSessionToken, getSessionToken } from '../../src/features/auth/session-store';

function renderPasswordScreen() {
  return render(
    <MantineProvider>
      <PasswordScreen />
    </MantineProvider>,
  );
}

describe('PasswordScreen', () => {
  beforeEach(() => {
    clearSessionToken();
  });

  afterEach(() => {
    clearSessionToken();
    vi.unstubAllGlobals();
  });

  it('stores the session token and clears the form on a successful login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'issued-token' }),
      }),
    );

    renderPasswordScreen();

    await userEvent.type(screen.getByLabelText(/password/i), 'correct-password');
    await userEvent.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => expect(getSessionToken()).toBe('issued-token'));
  });

  it('shows an inline error when the login request is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      }),
    );

    renderPasswordScreen();

    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Enter' }));

    expect(await screen.findByText('Incorrect password.')).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });
});
