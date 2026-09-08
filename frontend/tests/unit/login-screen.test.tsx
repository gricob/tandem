import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginScreen } from '../../src/features/auth/login-screen';
import { clearSessionToken, getSessionToken } from '../../src/features/auth/session-store';

function renderLoginScreen() {
  return render(
    <MantineProvider>
      <LoginScreen />
    </MantineProvider>,
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    clearSessionToken();
  });

  afterEach(() => {
    clearSessionToken();
    vi.unstubAllGlobals();
  });

  it('stores the session token on a successful login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'issued-token' }),
      }),
    );

    renderLoginScreen();

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'correct-password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

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

    renderLoginScreen();

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      await screen.findByText('Incorrect email or password.'),
    ).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });
});
