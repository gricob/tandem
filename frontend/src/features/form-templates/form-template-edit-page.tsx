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
import { ApiError } from '../../api/client';
import type { ConditionNode } from '../forms/condition';
import type { AvailableConditionField } from './components/condition-builder';
import { ConfirmDeleteModal } from './components/confirm-delete-modal';
import { FieldForm } from './components/field-form';
import { FieldList } from './components/field-list';
import type { FormTemplateField } from './api';
import {
  useAddField,
  useFormTemplate,
  useRemoveField,
  useReorderFields,
  useUpdateField,
  useUpdateFormTemplate,
} from './queries';
import {
  formTemplateSchema,
  type FieldFormValues,
  type FormTemplateFormValues,
} from './schemas';

export function FormTemplateEditPage() {
  const { formTemplateId } = useParams({
    from: '/form-templates/$formTemplateId',
  });
  const { data: formTemplate, isPending, isError } =
    useFormTemplate(formTemplateId);

  const updateFormTemplate = useUpdateFormTemplate(formTemplateId);
  const addField = useAddField(formTemplateId);
  const updateField = useUpdateField(formTemplateId);
  const removeField = useRemoveField(formTemplateId);
  const reorderFields = useReorderFields(formTemplateId);

  const [addingField, setAddingField] = useState(false);
  const [editingField, setEditingField] = useState<FormTemplateField | null>(
    null,
  );
  const [pendingRemove, setPendingRemove] = useState<FormTemplateField | null>(
    null,
  );
  const [removeError, setRemoveError] = useState<string | null>(null);

  const form = useForm<FormTemplateFormValues>({
    initialValues: { name: '', description: '' },
    validate: zod4Resolver(formTemplateSchema),
  });

  useEffect(() => {
    if (formTemplate) {
      form.setValues({
        name: formTemplate.name,
        description: formTemplate.description ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formTemplate?.id, formTemplate?.name, formTemplate?.description]);

  if (isPending) {
    return (
      <Container py="xl">
        <Text c="dimmed">Loading form template…</Text>
      </Container>
    );
  }

  if (isError || !formTemplate) {
    return (
      <Container py="xl">
        <Alert color="red" title="Couldn't load form template">
          Something went wrong. Try refreshing the page.
        </Alert>
      </Container>
    );
  }

  function handleSaveDetails(values: FormTemplateFormValues) {
    updateFormTemplate.mutate({
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
        condition:
          (values.condition as unknown as Record<string, unknown>) ??
          undefined,
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
          condition: values.condition as unknown as Record<string, unknown> | null,
        },
      },
      { onSuccess: () => setEditingField(null) },
    );
  }

  function handleConfirmRemove() {
    if (!pendingRemove) {
      return;
    }
    setRemoveError(null);
    removeField.mutate(pendingRemove.id, {
      onSuccess: () => setPendingRemove(null),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 400) {
          setRemoveError(
            "This field can't be removed: one or more other fields' " +
              'conditions depend on it. Update or remove those first.',
          );
        }
      },
    });
  }

  const otherFields = (excludeFieldId?: string): AvailableConditionField[] =>
    formTemplate.templateFields
      .filter((field) => field.id !== excludeFieldId)
      .map((field) => ({
        id: field.id,
        label: field.label,
        fieldType: field.fieldType,
        options: field.options ?? null,
      }));

  return (
    <Container py="xl">
      <Link to="/form-templates">
        <Anchor component="span" size="sm">
          ← Form templates
        </Anchor>
      </Link>

      <Title order={1} mt="xs" mb="lg">
        Edit form template
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
              <Button type="submit" loading={updateFormTemplate.isPending}>
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
            fields={formTemplate.templateFields}
            onReorder={(fieldIds) => reorderFields.mutate(fieldIds)}
            onEdit={(field) => setEditingField(field)}
            onRemove={(field) => {
              setRemoveError(null);
              setPendingRemove(field);
            }}
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
          availableFields={otherFields()}
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
              condition:
                (editingField.condition as unknown as ConditionNode | null) ??
                null,
            }}
            availableFields={otherFields(editingField.id)}
            submitLabel="Save"
            submitting={updateField.isPending}
            onSubmit={handleEditField}
            onCancel={() => setEditingField(null)}
          />
        )}
      </Modal>

      <ConfirmDeleteModal
        opened={pendingRemove !== null}
        error={removeError}
        title="Remove field"
        description={`Remove "${pendingRemove?.label}" from this form template?`}
        loading={removeField.isPending}
        onCancel={() => {
          setPendingRemove(null);
          setRemoveError(null);
        }}
        onConfirm={handleConfirmRemove}
      />
    </Container>
  );
}
