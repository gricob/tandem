import {
  Alert,
  Button,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useState, type FormEvent } from 'react';
import { login } from './api';
import { setSessionToken } from './session-store';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { accessToken } = await login(email, password);
      setSessionToken(accessToken);
    } catch {
      setError('Incorrect email or password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 26,
        background:
          'radial-gradient(120% 120% at 15% 0%, #2a2140 0%, #14131c 42%, #0a0a0d 100%)',
      }}
    >
      <Paper
        withBorder
        p="xl"
        w={420}
        style={{
          background: 'rgba(30, 30, 34, 0.82)',
          boxShadow: '0 40px 90px rgba(0, 0, 0, 0.6)',
        }}
      >
        <form onSubmit={(event) => void handleSubmit(event)}>
          <Stack gap="md">
            <Group gap={12} wrap="nowrap">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  flex: 'none',
                  background:
                    'linear-gradient(150deg, var(--mantine-color-accent-6), #8b5cf6)',
                  boxShadow: '0 8px 22px rgba(10, 132, 255, 0.35)',
                }}
              />
              <div>
                <Title order={1} fz={22} lh={1.2}>
                  Tandem
                </Title>
                <Text size="xs" c="dimmed">
                  Planificación y seguimiento de desarrollo
                </Text>
              </div>
            </Group>

            <TextInput
              type="email"
              label="Email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              autoFocus
              required
            />
            <PasswordInput
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
            />
            {error && (
              <Alert color="red" title="Couldn't log in">
                {error}
              </Alert>
            )}
            <Button type="submit" loading={submitting}>
              Log in
            </Button>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
