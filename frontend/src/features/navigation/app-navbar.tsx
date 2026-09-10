import {
  AppShell,
  Avatar,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import type { CSSProperties } from 'react';
import { clearSessionToken } from '../auth/session-store';
import { getAvatarColor, getInitials, roleLabel } from '../users/avatar-utils';
import { useCurrentUser } from '../users/queries';

function sectionStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    height: 28,
    padding: '0 14px',
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 600,
    color: active ? 'white' : 'var(--mantine-color-dimmed)',
    background: active ? 'var(--mantine-color-accent-6)' : 'transparent',
  };
}

export function AppNavbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const isWorkActive = pathname.startsWith('/work');
  const isAdminActive =
    pathname.startsWith('/form-templates') || pathname.startsWith('/invites');

  return (
    <AppShell.Header
      style={{
        background: 'var(--mantine-color-dark-8)',
        borderBottom: '1px solid var(--mantine-color-dark-6)',
      }}
    >
      <Group h="100%" px="md" justify="space-between" wrap="nowrap">
        <Group gap="lg" wrap="nowrap">
          <Link to="/work" style={{ textDecoration: 'none' }}>
            <Group gap={8} wrap="nowrap" component="span">
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background:
                    'linear-gradient(150deg, var(--mantine-color-accent-6), #8b5cf6)',
                }}
              />
              <Text fw={700} size="lg" component="span" c="white">
                Tandem
              </Text>
            </Group>
          </Link>

          <Group
            gap={2}
            wrap="nowrap"
            p={3}
            style={{
              background: 'var(--mantine-color-dark-9)',
              borderRadius: 10,
            }}
          >
            <Link to="/work" style={{ textDecoration: 'none' }}>
              <UnstyledButton
                component="span"
                style={sectionStyle(isWorkActive)}
              >
                Work
              </UnstyledButton>
            </Link>
            {isAdmin && (
              <Link to="/form-templates" style={{ textDecoration: 'none' }}>
                <UnstyledButton
                  component="span"
                  style={sectionStyle(isAdminActive)}
                >
                  Admin
                </UnstyledButton>
              </Link>
            )}
          </Group>
        </Group>

        <Menu shadow="md" width={220} position="bottom-end">
          <Menu.Target>
            <UnstyledButton
              aria-label={
                currentUser
                  ? `Account menu for ${currentUser.name}`
                  : 'Account menu'
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 34,
                padding: '0 8px 0 4px',
                borderRadius: 9,
                background: 'rgba(0, 0, 0, 0.24)',
              }}
            >
              <Avatar
                size={26}
                radius="xl"
                color={currentUser ? getAvatarColor(currentUser.id) : 'gray'}
                autoContrast
              >
                {currentUser ? getInitials(currentUser.name) : '?'}
              </Avatar>
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <Text size="xs" fw={600} c="white" lh={1.2}>
                  {currentUser?.name ?? 'Account'}
                </Text>
                <Text size="xs" c="dimmed" lh={1.2}>
                  {currentUser ? roleLabel(currentUser.role) : ''}
                </Text>
              </div>
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
                style={{ marginLeft: 2, flex: 'none' }}
              >
                <path
                  d="M3 5l3 3 3-3"
                  stroke="rgba(235,235,245,0.5)"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            {currentUser && (
              <>
                <Menu.Label>
                  {currentUser.name} · {roleLabel(currentUser.role)}
                </Menu.Label>
                <Menu.Divider />
              </>
            )}
            <Menu.Item
              color="red"
              onClick={() => {
                clearSessionToken();
                void navigate({ to: '/' });
              }}
            >
              Log out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </AppShell.Header>
  );
}
