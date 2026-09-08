import {
  Alert,
  Button,
  Container,
  PasswordInput,
  Stack,
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
    <Container size="xs" py="xl">
      <form onSubmit={(event) => void handleSubmit(event)}>
        <Stack gap="md">
          <Title order={1}>Create your account</Title>
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
    </Container>
  );
}
