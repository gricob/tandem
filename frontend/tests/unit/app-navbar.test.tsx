import { AppShell, MantineProvider } from '@mantine/core';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppNavbar } from '../../src/features/navigation/app-navbar';
import {
  clearSessionToken,
  getSessionToken,
  setSessionToken,
} from '../../src/features/auth/session-store';

const useCurrentUserMock = vi.fn();

vi.mock('../../src/features/users/queries', () => ({
  useCurrentUser: () => useCurrentUserMock(),
}));

function Page() {
  return null;
}

function TestShell() {
  return (
    <AppShell header={{ height: 60 }}>
      <AppNavbar />
    </AppShell>
  );
}

function renderNavbarAt(pathname: string) {
  const rootRoute = createRootRoute({ component: TestShell });
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: '/', component: Page }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/form-templates',
      component: Page,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/form-templates/$formTemplateId',
      component: Page,
    }),
    createRoute({ getParentRoute: () => rootRoute, path: '/invites', component: Page }),
    createRoute({ getParentRoute: () => rootRoute, path: '/work', component: Page }),
  ]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });

  return render(
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>,
  );
}

async function isSectionActive(name: string): Promise<boolean> {
  const link = await screen.findByRole('link', { name });
  const inner = link.firstElementChild as HTMLElement | null;
  return inner?.style.background.includes('accent') ?? false;
}

describe('AppNavbar', () => {
  beforeEach(() => {
    useCurrentUserMock.mockReturnValue({
      data: { id: 'user-1', email: 'admin@example.com', name: 'Ada Admin', role: 'admin' },
      isPending: false,
    });
  });

  afterEach(() => {
    clearSessionToken();
  });

  it('renders sections for Work and (for an admin) Admin', async () => {
    renderNavbarAt('/');

    expect(await screen.findByRole('link', { name: 'Work' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });

  it('highlights "Work" as active on /work', async () => {
    renderNavbarAt('/work');

    expect(await isSectionActive('Work')).toBe(true);
    expect(await isSectionActive('Admin')).toBe(false);
  });

  it.each(['/form-templates', '/form-templates/abc123', '/invites'])(
    'highlights "Admin" as active on %s',
    async (path) => {
      renderNavbarAt(path);

      expect(await isSectionActive('Admin')).toBe(true);
      expect(await isSectionActive('Work')).toBe(false);
    },
  );

  it('marks neither section as active on the home page', async () => {
    renderNavbarAt('/');

    expect(await isSectionActive('Work')).toBe(false);
    expect(await isSectionActive('Admin')).toBe(false);
  });

  it('hides "Admin" for a member account', async () => {
    useCurrentUserMock.mockReturnValue({
      data: { id: 'user-2', email: 'member@example.com', name: 'Mia Member', role: 'member' },
      isPending: false,
    });
    renderNavbarAt('/');

    expect(await screen.findByRole('link', { name: 'Work' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('shows the signed-in user\'s name and role in the account menu', async () => {
    renderNavbarAt('/');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Account menu for Ada Admin' }),
    );

    expect(screen.getAllByText('Ada Admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
  });

  it('still offers "Log out" when currentUser has not loaded yet', async () => {
    useCurrentUserMock.mockReturnValue({ data: undefined, isPending: true });
    setSessionToken('some-token');
    renderNavbarAt('/');

    await userEvent.click(await screen.findByRole('button', { name: 'Account menu' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    expect(getSessionToken()).toBeNull();
  });

  it('clears the session token when "Log out" is clicked from the account menu', async () => {
    setSessionToken('some-token');
    renderNavbarAt('/');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Account menu for Ada Admin' }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    expect(getSessionToken()).toBeNull();
  });
});
