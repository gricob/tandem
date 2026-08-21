import {
  Alert,
  Anchor,
  Button,
  Container,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useParams } from '@tanstack/react-router';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { ConfirmDeleteModal } from './components/confirm-delete-modal';
import { FieldForm } from './components/field-form';
import { FieldList } from './components/field-list';
import type { FormField } from './api';
import {
  useAddField,
  useFormType,
  useRemoveField,
  useReorderFields,
  useUpdateField,
  useUpdateFormType,
} from './queries';
import {
  formTypeSchema,
  type FieldFormValues,
  type FormTypeFormValues,
} from './schemas';

export function FormTypeEditPage() {
  const { formTypeId } = useParams({ from: '/form-types/$formTypeId' });
  const { data: formType, isPending, isError } = useFormType(formTypeId);

  const updateFormType = useUpdateFormType(formTypeId);
  const addField = useAddField(formTypeId);
  const updateField = useUpdateField(formTypeId);
  const removeField = useRemoveField(formTypeId);
  const reorderFields = useReorderFields(formTypeId);

  const [addingField, setAddingField] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [pendingRemove, setPendingRemove] = useState<FormField | null>(null);

  const form = useForm<FormTypeFormValues>({
    initialValues: { name: '', description: '' },
    validate: zod4Resolver(formTypeSchema),
  });

  useEffect(() => {
    if (formType) {
      form.setValues({
        name: formType.name,
        description: formType.description ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formType?.id, formType?.name, formType?.description]);

  if (isPending) {
    return (
      <Container py="xl">
        <Text c="dimmed">Loading form type…</Text>
      </Container>
    );
  }

  if (isError || !formType) {
    return (
      <Container py="xl">
        <Alert color="red" title="Couldn't load form type">
          Something went wrong. Try refreshing the page.
        </Alert>
      </Container>
    );
  }

  function handleSaveDetails(values: FormTypeFormValues) {
    updateFormType.mutate({
      name: values.name,
      description: values.description || undefined,
    });
  }

  function handleAddField(values: FieldFormValues) {
    addField.mutate(
      {
        label: values.label,
        fieldType: values.fieldType,
        isRequired: values.isRequired,
        options: values.options.length > 0 ? values.options : undefined,
      },
      { onSuccess: () => setAddingField(false) },
    );
  }

  function handleEditField(values: FieldFormValues) {
    if (!editingField) {
      return;
    }
    updateField.mutate(
      {
        fieldId: editingField.id,
        body: {
          label: values.label,
          fieldType: values.fieldType,
          isRequired: values.isRequired,
          options: values.options.length > 0 ? values.options : null,
        },
      },
      { onSuccess: () => setEditingField(null) },
    );
  }

  function handleConfirmRemove() {
    if (!pendingRemove) {
      return;
    }
    removeField.mutate(pendingRemove.id, {
      onSuccess: () => setPendingRemove(null),
    });
  }

  return (
    <Container py="xl">
      <Link to="/form-types">
        <Anchor component="span" size="sm">
          ← Form types
        </Anchor>
      </Link>

      <Title order={1} mt="xs" mb="lg">
        Edit form type
      </Title>

      <Stack gap="lg">
        <form onSubmit={form.onSubmit(handleSaveDetails)}>
          <Stack gap="sm" maw={480}>
            <TextInput label="Name" required {...form.getInputProps('name')} />
            <Textarea
              label="Description"
              {...form.getInputProps('description')}
            />
            <Group>
              <Button type="submit" loading={updateFormType.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>

        <div>
          <Group justify="space-between" mb="sm">
            <Title order={2} size="h3">
              Fields
            </Title>
            <Button size="xs" onClick={() => setAddingField(true)}>
              Add field
            </Button>
          </Group>

          <FieldList
            fields={formType.fields}
            onReorder={(fieldIds) => reorderFields.mutate(fieldIds)}
            onEdit={(field) => setEditingField(field)}
            onRemove={(field) => setPendingRemove(field)}
          />
        </div>
      </Stack>

      <Modal
        opened={addingField}
        onClose={() => setAddingField(false)}
        title="Add field"
        centered
      >
        <FieldForm
          submitLabel="Add"
          submitting={addField.isPending}
          onSubmit={handleAddField}
          onCancel={() => setAddingField(false)}
        />
      </Modal>

      <Modal
        opened={editingField !== null}
        onClose={() => setEditingField(null)}
        title="Edit field"
        centered
      >
        {editingField && (
          <FieldForm
            initialValues={{
              label: editingField.label,
              fieldType: editingField.fieldType,
              isRequired: editingField.isRequired,
              options: editingField.options ?? [],
            }}
            submitLabel="Save"
            submitting={updateField.isPending}
            onSubmit={handleEditField}
            onCancel={() => setEditingField(null)}
          />
        )}
      </Modal>

      <ConfirmDeleteModal
        opened={pendingRemove !== null}
        title="Remove field"
        description={`Remove "${pendingRemove?.label}" from this form type?`}
        loading={removeField.isPending}
        onCancel={() => setPendingRemove(null)}
        onConfirm={handleConfirmRemove}
      />
    </Container>
  );
}
