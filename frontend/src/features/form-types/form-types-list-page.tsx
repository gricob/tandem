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
import { CreateFormTypeModal } from './components/create-form-type-modal';
import { ConfirmDeleteModal } from './components/confirm-delete-modal';
import type { FormType } from './api';
import { useCreateFormType, useDeleteFormType, useFormTypes } from './queries';
import type { FormTypeFormValues } from './schemas';

export function FormTypesListPage() {
  const { data: formTypes, isPending, isError } = useFormTypes();
  const createFormType = useCreateFormType();
  const deleteFormType = useDeleteFormType();
  const navigate = useNavigate();

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FormType | null>(null);

  function handleCreate(values: FormTypeFormValues) {
    createFormType.mutate(
      { name: values.name, description: values.description || undefined },
      {
        onSuccess: (created) => {
          setCreateModalOpened(false);
          void navigate({
            to: '/form-types/$formTypeId',
            params: { formTypeId: created.id },
          });
        },
      },
    );
  }

  function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    deleteFormType.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  }

  return (
    <Container py="xl">
      <Group justify="space-between" mb="md">
        <Title order={1}>Form types</Title>
        <Button onClick={() => setCreateModalOpened(true)}>
          New form type
        </Button>
      </Group>

      {isPending && <Text c="dimmed">Loading form types…</Text>}
      {isError && (
        <Alert color="red" title="Couldn't load form types">
          Something went wrong. Try refreshing the page.
        </Alert>
      )}

      {formTypes && formTypes.length === 0 && (
        <Text c="dimmed">No form types yet. Create one to get started.</Text>
      )}

      {formTypes && formTypes.length > 0 && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Fields</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {formTypes.map((formType) => (
              <Table.Tr key={formType.id}>
                <Table.Td>
                  <Link
                    to="/form-types/$formTypeId"
                    params={{ formTypeId: formType.id }}
                  >
                    <Anchor component="span">{formType.name}</Anchor>
                  </Link>
                </Table.Td>
                <Table.Td>{formType.description}</Table.Td>
                <Table.Td>{formType.fields.length}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Link
                      to="/form-types/$formTypeId"
                      params={{ formTypeId: formType.id }}
                    >
                      <Button component="span" variant="subtle" size="xs">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => setPendingDelete(formType)}
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

      <CreateFormTypeModal
        opened={createModalOpened}
        submitting={createFormType.isPending}
        onClose={() => setCreateModalOpened(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDeleteModal
        opened={pendingDelete !== null}
        title="Delete form type"
        description={`Delete "${pendingDelete?.name}"? This also deletes its fields and can't be undone.`}
        loading={deleteFormType.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </Container>
  );
}
