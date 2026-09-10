import { Stack, Text, UnstyledButton } from '@mantine/core';
import { Link, useLocation } from '@tanstack/react-router';
import type { CSSProperties } from 'react';

const ADMIN_DESTINATIONS = [
  {
    label: 'Formularios',
    hint: 'Reusable field sets',
    to: '/form-templates' as const,
    isActive: (pathname: string) => pathname.startsWith('/form-templates'),
  },
  {
    label: 'Invite users',
    hint: 'Send account invites',
    to: '/invites' as const,
    isActive: (pathname: string) => pathname.startsWith('/invites'),
  },
];

function itemStyle(active: boolean): CSSProperties {
  return {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    background: active ? 'rgba(10, 132, 255, 0.14)' : 'transparent',
    boxShadow: active ? 'inset 0 0 0 1px rgba(10, 132, 255, 0.4)' : 'none',
  };
}

export function AdminNav() {
  const { pathname } = useLocation();

  return (
    <Stack
      gap={3}
      w={220}
      style={{
        flex: 'none',
        borderRight: '1px solid var(--mantine-color-dark-6)',
        background: 'var(--mantine-color-dark-8)',
      }}
      p="sm"
    >
      <Text size="xs" fw={700} tt="uppercase" c="dimmed" px="xs" py={4}>
        Administración
      </Text>
      {ADMIN_DESTINATIONS.map((dest) => {
        const active = dest.isActive(pathname);
        return (
          <Link key={dest.to} to={dest.to} style={{ textDecoration: 'none' }}>
            <UnstyledButton component="span" style={itemStyle(active)}>
              <Text size="sm" fw={600} c={active ? 'white' : undefined}>
                {dest.label}
              </Text>
              <Text size="xs" c="dimmed">
                {dest.hint}
              </Text>
            </UnstyledButton>
          </Link>
        );
      })}
    </Stack>
  );
}
