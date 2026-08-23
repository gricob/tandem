import {
  Alert,
  Anchor,
  Button,
  Container,
  Group,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ConfirmDeleteModal } from './components/confirm-delete-modal';
import { CreateWorkstreamModal } from './components/create-workstream-modal';
import type { Workstream } from './api';
import {
  useCreateWorkstream,
  useDeleteWorkstream,
  useWorkstreams,
} from './queries';
import type { WorkstreamFormValues } from './schemas';

export function WorkstreamsListPage() {
  const { data: workstreams, isPending, isError } = useWorkstreams();
  const createWorkstream = useCreateWorkstream();
  const deleteWorkstream = useDeleteWorkstream();
  const navigate = useNavigate();

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Workstream | null>(null);

  function handleCreate(values: WorkstreamFormValues) {
    createWorkstream.mutate(
      { name: values.name, description: values.description || undefined },
      {
        onSuccess: (created) => {
          setCreateModalOpened(false);
          void navigate({
            to: '/workstreams/$workstreamId',
            params: { workstreamId: created.id },
          });
        },
      },
    );
  }

  function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    deleteWorkstream.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  }

  return (
    <Container py="xl">
      <Group justify="space-between" mb="md">
        <Title order={1}>Workstreams</Title>
        <Button onClick={() => setCreateModalOpened(true)}>
          New workstream
        </Button>
      </Group>

      {isPending && <Text c="dimmed">Loading workstreams…</Text>}
      {isError && (
        <Alert color="red" title="Couldn't load workstreams">
          Something went wrong. Try refreshing the page.
        </Alert>
      )}

      {workstreams && workstreams.length === 0 && (
        <Text c="dimmed">No workstreams yet. Create one to get started.</Text>
      )}

      {workstreams && workstreams.length > 0 && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {workstreams.map((workstream) => (
              <Table.Tr key={workstream.id}>
                <Table.Td>
                  <Link
                    to="/workstreams/$workstreamId"
                    params={{ workstreamId: workstream.id }}
                  >
                    <Anchor component="span">{workstream.name}</Anchor>
                  </Link>
                </Table.Td>
                <Table.Td>{workstream.description}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Link
                      to="/workstreams/$workstreamId"
                      params={{ workstreamId: workstream.id }}
                    >
                      <Button component="span" variant="subtle" size="xs">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => setPendingDelete(workstream)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <CreateWorkstreamModal
        opened={createModalOpened}
        submitting={createWorkstream.isPending}
        onClose={() => setCreateModalOpened(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDeleteModal
        opened={pendingDelete !== null}
        title="Delete workstream"
        description={`Delete "${pendingDelete?.name}"? This also deletes all of its deliverables.`}
        loading={deleteWorkstream.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </Container>
  );
}
