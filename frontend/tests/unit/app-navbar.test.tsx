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
    createRoute({ getParentRoute: () => rootRoute, path: '/forms', component: Page }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/forms/$formId',
      component: Page,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/forms/$formId/fill',
      component: Page,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/forms/$formId/response',
      component: Page,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/deliverables/$deliverableId',
      component: Page,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/workstreams',
      component: Page,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/workstreams/$workstreamId',
      component: Page,
    }),
    createRoute({ getParentRoute: () => rootRoute, path: '/invites', component: Page }),
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

async function variantOfLink(name: string): Promise<string | null> {
  const link = await screen.findByRole('link', { name });
  return link.firstElementChild?.getAttribute('data-variant') ?? null;
}

describe('AppNavbar', () => {
  beforeEach(() => {
    useCurrentUserMock.mockReturnValue({
      data: { id: 'user-1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
      isPending: false,
    });
  });

  afterEach(() => {
    clearSessionToken();
  });

  it('renders links to all top-level sections', async () => {
    renderNavbarAt('/');

    expect(await screen.findByRole('link', { name: 'Form templates' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forms' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Workstreams' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Invite users' })).toBeInTheDocument();
  });

  it.each(['/invites'])('highlights "Invite users" as active on %s', async (path) => {
    renderNavbarAt(path);

    expect(await variantOfLink('Invite users')).toBe('light');
    expect(await variantOfLink('Form templates')).toBe('subtle');
    expect(await variantOfLink('Forms')).toBe('subtle');
    expect(await variantOfLink('Workstreams')).toBe('subtle');
  });

  it('highlights "Form templates" as active on its edit route', async () => {
    renderNavbarAt('/form-templates/abc123');

    expect(await variantOfLink('Form templates')).toBe('light');
    expect(await variantOfLink('Forms')).toBe('subtle');
    expect(await variantOfLink('Workstreams')).toBe('subtle');
  });

  it('marks neither section as active on the home page', async () => {
    renderNavbarAt('/');

    expect(await variantOfLink('Form templates')).toBe('subtle');
    expect(await variantOfLink('Forms')).toBe('subtle');
    expect(await variantOfLink('Workstreams')).toBe('subtle');
    expect(await variantOfLink('Invite users')).toBe('subtle');
  });

  it.each(['/forms', '/forms/f1', '/forms/f1/fill', '/forms/f1/response'])(
    'highlights "Forms" as active on %s',
    async (path) => {
      renderNavbarAt(path);

      expect(await variantOfLink('Forms')).toBe('light');
      expect(await variantOfLink('Form templates')).toBe('subtle');
      expect(await variantOfLink('Workstreams')).toBe('subtle');
    },
  );

  it.each(['/workstreams', '/workstreams/w1'])(
    'highlights "Workstreams" as active on %s',
    async (path) => {
      renderNavbarAt(path);

      expect(await variantOfLink('Workstreams')).toBe('light');
      expect(await variantOfLink('Form templates')).toBe('subtle');
      expect(await variantOfLink('Forms')).toBe('subtle');
    },
  );

  it('hides "Invite users" for a member account', async () => {
    useCurrentUserMock.mockReturnValue({
      data: { id: 'user-2', email: 'member@example.com', name: 'Member', role: 'member' },
      isPending: false,
    });
    renderNavbarAt('/');

    expect(await screen.findByRole('link', { name: 'Form templates' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Invite users' })).not.toBeInTheDocument();
  });

  it('clears the session token when "Log out" is clicked', async () => {
    setSessionToken('some-token');
    renderNavbarAt('/');

    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(getSessionToken()).toBeNull();
  });
});
