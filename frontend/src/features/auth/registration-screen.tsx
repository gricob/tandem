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
import { ApiError } from '../../api/client';
import { register } from './api';
import { setSessionToken } from './session-store';

export function RegistrationScreen() {
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token') ?? '';
  const emailFromInvite = searchParams.get('email');
  const [email, setEmail] = useState(emailFromInvite ?? '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { accessToken } = await register({ token, email, password, name });
      setSessionToken(accessToken);
      window.location.assign('/');
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Try again.',
      );
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
                  Create your account
                </Text>
              </div>
            </Group>

            <TextInput
              type="email"
              label="Email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              readOnly={emailFromInvite !== null}
              autoFocus={emailFromInvite === null}
              required
            />
            <TextInput
              label="Name"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              autoFocus={emailFromInvite !== null}
              required
            />
            <PasswordInput
              label="Password"
              description="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              minLength={8}
              required
            />
            {error && (
              <Alert color="red" title="Couldn't create your account">
                {error}
              </Alert>
            )}
            <Button type="submit" loading={submitting}>
              Create account
            </Button>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
