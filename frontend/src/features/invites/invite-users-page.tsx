import {
  Alert,
  Button,
  Container,
  CopyButton,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { ApiError } from '../../api/client';
import { useCurrentUser } from '../users/queries';
import { useCreateInvite } from './queries';
import { inviteSchema, type InviteFormValues } from './schemas';

export function InviteUsersPage() {
  const { data: currentUser, isPending: isCurrentUserPending } =
    useCurrentUser();
  const createInvite = useCreateInvite();
  const form = useForm<InviteFormValues>({
    initialValues: { email: '', role: 'member' },
    validate: zod4Resolver(inviteSchema),
  });

  function handleSubmit(values: InviteFormValues) {
    createInvite.mutate(values, {
      onSuccess: () => form.reset(),
    });
  }

  const invite = createInvite.data;
  const inviteLink = invite
    ? `${window.location.origin}/register?token=${invite.token}&email=${encodeURIComponent(invite.email)}`
    : null;

  const errorMessage =
    createInvite.error instanceof ApiError && createInvite.error.status === 403
      ? 'Only admins can invite users.'
      : "Couldn't create the invite. Try again.";

  if (isCurrentUserPending) {
    return (
      <Container size="xs" py="xl">
        <Text c="dimmed">Loading…</Text>
      </Container>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <Container size="xs" py="xl">
        <Title order={1} mb="md">
          Invite users
        </Title>
        <Alert color="red" title="Admins only">
          Only admins can invite users.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl">
      <Title order={1} mb="md">
        Invite users
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            type="email"
            label="Email"
            required
            autoFocus
            {...form.getInputProps('email')}
          />
          <Select
            label="Role"
            data={[
              { value: 'member', label: 'Member' },
              { value: 'admin', label: 'Admin' },
            ]}
            allowDeselect={false}
            {...form.getInputProps('role')}
          />
          {createInvite.isError && (
            <Alert color="red" title="Couldn't send invite">
              {errorMessage}
            </Alert>
          )}
          <Group justify="flex-end">
            <Button type="submit" loading={createInvite.isPending}>
              Send invite
            </Button>
          </Group>
        </Stack>
      </form>

      {invite && inviteLink && (
        <Alert color="green" title="Invite created" mt="lg">
          <Stack gap="xs">
            <Text size="sm">
              Share this link with {invite.email}. It expires on{' '}
              {new Date(invite.expiresAt).toLocaleDateString()}.
            </Text>
            <Group gap="xs" wrap="nowrap">
              <TextInput value={inviteLink} readOnly style={{ flex: 1 }} />
              <CopyButton value={inviteLink}>
                {({ copied, copy }) => (
                  <Button variant="default" onClick={copy}>
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </CopyButton>
            </Group>
          </Stack>
        </Alert>
      )}
    </Container>
  );
}
