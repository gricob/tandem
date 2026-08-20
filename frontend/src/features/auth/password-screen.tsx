import { Alert, Button, Container, PasswordInput, Stack, Title } from '@mantine/core';
import { useState, type FormEvent } from 'react';
import { login } from './api';
import { setSessionToken } from './session-store';

export function PasswordScreen() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { accessToken } = await login(password);
      setSessionToken(accessToken);
    } catch {
      setError('Incorrect password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="xs" py="xl">
      <form onSubmit={(event) => void handleSubmit(event)}>
        <Stack gap="md">
          <Title order={1}>Tandem</Title>
          <PasswordInput
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            autoFocus
            required
          />
          {error && (
            <Alert color="red" title="Couldn't log in">
              {error}
            </Alert>
          )}
          <Button type="submit" loading={submitting}>
            Enter
          </Button>
        </Stack>
      </form>
    </Container>
  );
}
