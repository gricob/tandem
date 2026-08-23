import { AppShell, Button, Group, Text } from '@mantine/core';
import { Link, useLocation } from '@tanstack/react-router';
import { clearSessionToken } from '../auth/session-store';

export function AppNavbar() {
  const { pathname } = useLocation();
  const isFormTemplatesActive = pathname.startsWith('/form-templates');
  const isFormsActive = pathname.startsWith('/forms');
  const isWorkstreamsActive = pathname.startsWith('/workstreams');

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group gap="lg">
          <Link to="/">
            <Text fw={700} size="lg" component="span">
              Tandem
            </Text>
          </Link>
          <Group gap="xs">
            <Link to="/form-templates">
              <Button
                component="span"
                variant={isFormTemplatesActive ? 'light' : 'subtle'}
              >
                Form templates
              </Button>
            </Link>
            <Link to="/forms">
              <Button component="span" variant={isFormsActive ? 'light' : 'subtle'}>
                Forms
              </Button>
            </Link>
            <Link to="/workstreams">
              <Button
                component="span"
                variant={isWorkstreamsActive ? 'light' : 'subtle'}
              >
                Workstreams
              </Button>
            </Link>
          </Group>
        </Group>
        <Button variant="default" onClick={() => clearSessionToken()}>
          Log out
        </Button>
      </Group>
    </AppShell.Header>
  );
}
