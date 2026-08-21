import {
  Alert,
  Anchor,
  Button,
  Container,
  Group,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ConfirmDeleteModal } from './components/confirm-delete-modal';
import { CreateFormModal } from './components/create-form-modal';
import type { Form } from './api';
import { useCreateForm, useDeleteForm, useForms } from './queries';
import type { CreateFormFormValues } from './schemas';

export function FormsListPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const { data: forms, isPending, isError } = useForms(debouncedSearch);
  const createForm = useCreateForm();
  const deleteForm = useDeleteForm();
  const navigate = useNavigate();

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Form | null>(null);

  function handleCreate(values: CreateFormFormValues) {
    createForm.mutate(
      {
        formTemplateId: values.formTemplateId,
        name: values.name,
        description: values.description || undefined,
      },
      {
        onSuccess: (created) => {
          setCreateModalOpened(false);
          void navigate({
            to: '/forms/$formId',
            params: { formId: created.id },
          });
        },
      },
    );
  }

  function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    deleteForm.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  }

  return (
    <Container py="xl">
      <Group justify="space-between" mb="md">
        <Title order={1}>Forms</Title>
        <Button onClick={() => setCreateModalOpened(true)}>New form</Button>
      </Group>

      <TextInput
        placeholder="Search forms by name"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
        maw={360}
      />

      {isPending && <Text c="dimmed">Loading forms…</Text>}
      {isError && (
        <Alert color="red" title="Couldn't load forms">
          Something went wrong. Try refreshing the page.
        </Alert>
      )}

      {forms && forms.length === 0 && (
        <Text c="dimmed">No forms found.</Text>
      )}

      {forms && forms.length > 0 && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Form template</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {forms.map((form) => (
              <Table.Tr key={form.id}>
                <Table.Td>
                  <Link to="/forms/$formId" params={{ formId: form.id }}>
                    <Anchor component="span">{form.name}</Anchor>
                  </Link>
                </Table.Td>
                <Table.Td>{form.description}</Table.Td>
                <Table.Td>{form.formTemplateName ?? '— deleted —'}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Link to="/forms/$formId" params={{ formId: form.id }}>
                      <Button component="span" variant="subtle" size="xs">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => setPendingDelete(form)}
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

      <CreateFormModal
        opened={createModalOpened}
        submitting={createForm.isPending}
        onClose={() => setCreateModalOpened(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDeleteModal
        opened={pendingDelete !== null}
        title="Delete form"
        description={`Delete "${pendingDelete?.name}"? This can't be undone.`}
        loading={deleteForm.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </Container>
  );
}
