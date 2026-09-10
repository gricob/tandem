import { AppShell, Group } from '@mantine/core';
import { Outlet, useLocation } from '@tanstack/react-router';
import { AdminNav } from './admin-nav';
import { AppNavbar } from './app-navbar';

export function RootLayout() {
  const { pathname } = useLocation();
  const isAdminRoute =
    pathname.startsWith('/form-templates') || pathname.startsWith('/invites');

  return (
    <AppShell
      header={{ height: 60 }}
      styles={{ main: { padding: 0, paddingTop: 60 } }}
    >
      <AppNavbar />
      <AppShell.Main>
        {isAdminRoute ? (
          <Group
            align="stretch"
            gap={0}
            wrap="nowrap"
            style={{ height: 'calc(100vh - 60px)' }}
          >
            <AdminNav />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                height: '100%',
                overflowY: 'auto',
              }}
            >
              <Outlet />
            </div>
          </Group>
        ) : (
          <Outlet />
        )}
      </AppShell.Main>
    </AppShell>
  );
}
