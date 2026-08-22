import { AppShell } from '@mantine/core';
import { Outlet } from '@tanstack/react-router';
import { AppNavbar } from './app-navbar';

export function RootLayout() {
  return (
    <AppShell header={{ height: 60 }}>
      <AppNavbar />
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
