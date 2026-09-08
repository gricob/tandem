import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegistrationScreen } from '../../src/features/auth/registration-screen';
import { clearSessionToken, getSessionToken } from '../../src/features/auth/session-store';

function renderRegistrationScreen(token = 'invite-token', email?: string) {
  const search = email
    ? `?token=${token}&email=${encodeURIComponent(email)}`
    : `?token=${token}`;
  window.history.pushState({}, '', `/register${search}`);
  return render(
    <MantineProvider>
      <RegistrationScreen />
    </MantineProvider>,
  );
}

describe('RegistrationScreen', () => {
  beforeEach(() => {
    clearSessionToken();
  });

  afterEach(() => {
    clearSessionToken();
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
  });

  it('stores the session token on a successful registration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'issued-token' }),
      }),
    );

    renderRegistrationScreen();

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/password/i), 'a-good-password');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(getSessionToken()).toBe('issued-token'));
  });

  it('shows the backend-provided reason when the invite is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'This invite has expired.' }),
      }),
    );

    renderRegistrationScreen('expired-token');

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/password/i), 'a-good-password');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('This invite has expired.')).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it('shows a generic message when the request fails outside the API contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    renderRegistrationScreen('some-token');

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/password/i), 'a-good-password');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Something went wrong. Try again.')).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it('pre-fills and locks the email when the invite link includes one', () => {
    renderRegistrationScreen('invite-token', 'alice@example.com');

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('alice@example.com');
    expect(emailInput).toHaveAttribute('readonly');
  });
});
