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
import { CreateFormTemplateModal } from './components/create-form-template-modal';
import { ConfirmDeleteModal } from './components/confirm-delete-modal';
import type { FormTemplate } from './api';
import {
  useCreateFormTemplate,
  useDeleteFormTemplate,
  useFormTemplates,
} from './queries';
import type { FormTemplateFormValues } from './schemas';

export function FormTemplatesListPage() {
  const { data: formTemplates, isPending, isError } = useFormTemplates();
  const createFormTemplate = useCreateFormTemplate();
  const deleteFormTemplate = useDeleteFormTemplate();
  const navigate = useNavigate();

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FormTemplate | null>(
    null,
  );

  function handleCreate(values: FormTemplateFormValues) {
    createFormTemplate.mutate(
      { name: values.name, description: values.description || undefined },
      {
        onSuccess: (created) => {
          setCreateModalOpened(false);
          void navigate({
            to: '/form-templates/$formTemplateId',
            params: { formTemplateId: created.id },
          });
        },
      },
    );
  }

  function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    deleteFormTemplate.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  }

  return (
    <Container py="xl">
      <Group justify="space-between" mb="md">
        <Title order={1}>Form templates</Title>
        <Button onClick={() => setCreateModalOpened(true)}>
          New form template
        </Button>
      </Group>

      {isPending && <Text c="dimmed">Loading form templates…</Text>}
      {isError && (
        <Alert color="red" title="Couldn't load form templates">
          Something went wrong. Try refreshing the page.
        </Alert>
      )}

      {formTemplates && formTemplates.length === 0 && (
        <Text c="dimmed">
          No form templates yet. Create one to get started.
        </Text>
      )}

      {formTemplates && formTemplates.length > 0 && (
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
            {formTemplates.map((formTemplate) => (
              <Table.Tr key={formTemplate.id}>
                <Table.Td>
                  <Link
                    to="/form-templates/$formTemplateId"
                    params={{ formTemplateId: formTemplate.id }}
                  >
                    <Anchor component="span">{formTemplate.name}</Anchor>
                  </Link>
                </Table.Td>
                <Table.Td>{formTemplate.description}</Table.Td>
                <Table.Td>{formTemplate.templateFields.length}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Link
                      to="/form-templates/$formTemplateId"
                      params={{ formTemplateId: formTemplate.id }}
                    >
                      <Button component="span" variant="subtle" size="xs">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => setPendingDelete(formTemplate)}
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

      <CreateFormTemplateModal
        opened={createModalOpened}
        submitting={createFormTemplate.isPending}
        onClose={() => setCreateModalOpened(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDeleteModal
        opened={pendingDelete !== null}
        title="Delete form template"
        description={`Delete "${pendingDelete?.name}"? Forms already created from it will keep working with their own fields — this only removes the template.`}
        loading={deleteFormTemplate.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </Container>
  );
}
