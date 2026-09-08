import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../src/api/client';
import { InviteUsersPage } from '../../src/features/invites/invite-users-page';

const createInviteMutate = vi.fn();
const useCreateInviteMock = vi.fn();
const useCurrentUserMock = vi.fn();

vi.mock('../../src/features/invites/queries', () => ({
  useCreateInvite: () => useCreateInviteMock(),
}));

vi.mock('../../src/features/users/queries', () => ({
  useCurrentUser: () => useCurrentUserMock(),
}));

// Mantine's generated `id`/`for` pair on labelled inputs is unreliable under
// jsdom (confirmed working in a real browser), so fields are queried by the
// stable `data-path` attribute `form.getInputProps` sets instead of by label.
function getInput(path: string): HTMLElement {
  const input = document.querySelector(`[data-path="${path}"]`);
  if (!input) {
    throw new Error(`No input found for data-path="${path}"`);
  }
  return input as HTMLElement;
}

function renderPage() {
  render(
    <MantineProvider>
      <InviteUsersPage />
    </MantineProvider>,
  );
}

describe('InviteUsersPage', () => {
  beforeEach(() => {
    useCurrentUserMock.mockReturnValue({
      data: { id: 'user-1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
      isPending: false,
    });
  });

  it('shows a loading state while the current user is being fetched', () => {
    useCurrentUserMock.mockReturnValue({ data: undefined, isPending: true });
    useCreateInviteMock.mockReturnValue({
      mutate: createInviteMutate,
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
    });
    renderPage();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send invite' })).not.toBeInTheDocument();
  });

  it('shows an admin-only notice instead of the form for a member', () => {
    useCurrentUserMock.mockReturnValue({
      data: { id: 'user-2', email: 'member@example.com', name: 'Member', role: 'member' },
      isPending: false,
    });
    useCreateInviteMock.mockReturnValue({
      mutate: createInviteMutate,
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
    });
    renderPage();

    expect(screen.getByText('Only admins can invite users.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send invite' })).not.toBeInTheDocument();
  });

  it('submits the entered email with the default member role', async () => {
    useCreateInviteMock.mockReturnValue({
      mutate: createInviteMutate,
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
    });
    renderPage();

    await userEvent.type(getInput('email'), 'alice@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));

    expect(createInviteMutate).toHaveBeenCalledWith(
      { email: 'alice@example.com', role: 'member' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('shows the invite link once the invite is created', () => {
    useCreateInviteMock.mockReturnValue({
      mutate: createInviteMutate,
      isPending: false,
      isError: false,
      error: null,
      data: {
        id: 'invite-1',
        email: 'alice@example.com',
        role: 'member',
        token: 'secret-token',
        expiresAt: '2026-09-07T00:00:00.000Z',
        createdAt: '2026-08-31T00:00:00.000Z',
      },
    });
    renderPage();

    expect(screen.getByText(/Share this link with alice@example.com/)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        /token=secret-token&email=alice%40example\.com/,
      ),
    ).toBeInTheDocument();
  });

  it('shows an admin-only message when a non-admin is rejected', () => {
    useCreateInviteMock.mockReturnValue({
      mutate: createInviteMutate,
      isPending: false,
      isError: true,
      error: new ApiError(403, 'Forbidden'),
      data: undefined,
    });
    renderPage();

    expect(
      screen.getByText('Only admins can invite users.'),
    ).toBeInTheDocument();
  });

  it('shows a generic error message for other failures', () => {
    useCreateInviteMock.mockReturnValue({
      mutate: createInviteMutate,
      isPending: false,
      isError: true,
      error: new ApiError(500, 'Server error'),
      data: undefined,
    });
    renderPage();

    expect(
      screen.getByText("Couldn't create the invite. Try again."),
    ).toBeInTheDocument();
  });
});
