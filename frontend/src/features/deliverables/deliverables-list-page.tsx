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
import { CreateDeliverableModal } from './components/create-deliverable-modal';
import type { Deliverable } from './api';
import {
  useCreateDeliverable,
  useDeleteDeliverable,
  useDeliverables,
} from './queries';
import type { DeliverableFormValues } from './schemas';

export function DeliverablesListPage() {
  const { data: deliverables, isPending, isError } = useDeliverables();
  const createDeliverable = useCreateDeliverable();
  const deleteDeliverable = useDeleteDeliverable();
  const navigate = useNavigate();

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Deliverable | null>(null);

  function handleCreate(values: DeliverableFormValues) {
    createDeliverable.mutate(
      { name: values.name, description: values.description || undefined },
      {
        onSuccess: (created) => {
          setCreateModalOpened(false);
          void navigate({
            to: '/deliverables/$deliverableId',
            params: { deliverableId: created.id },
          });
        },
      },
    );
  }

  function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    deleteDeliverable.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  }

  return (
    <Container py="xl">
      <Group justify="space-between" mb="md">
        <Title order={1}>Deliverables</Title>
        <Button onClick={() => setCreateModalOpened(true)}>
          New deliverable
        </Button>
      </Group>

      {isPending && <Text c="dimmed">Loading deliverables…</Text>}
      {isError && (
        <Alert color="red" title="Couldn't load deliverables">
          Something went wrong. Try refreshing the page.
        </Alert>
      )}

      {deliverables && deliverables.length === 0 && (
        <Text c="dimmed">No deliverables yet. Create one to get started.</Text>
      )}

      {deliverables && deliverables.length > 0 && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {deliverables.map((deliverable) => (
              <Table.Tr key={deliverable.id}>
                <Table.Td>
                  <Link
                    to="/deliverables/$deliverableId"
                    params={{ deliverableId: deliverable.id }}
                  >
                    <Anchor component="span">{deliverable.name}</Anchor>
                  </Link>
                </Table.Td>
                <Table.Td>{deliverable.description}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Link
                      to="/deliverables/$deliverableId"
                      params={{ deliverableId: deliverable.id }}
                    >
                      <Button component="span" variant="subtle" size="xs">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => setPendingDelete(deliverable)}
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

      <CreateDeliverableModal
        opened={createModalOpened}
        submitting={createDeliverable.isPending}
        onClose={() => setCreateModalOpened(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDeleteModal
        opened={pendingDelete !== null}
        title="Delete deliverable"
        description={`Delete "${pendingDelete?.name}"?`}
        loading={deleteDeliverable.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </Container>
  );
}
