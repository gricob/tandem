import {
  Button,
  Group,
  Select,
  Stack,
  Switch,
  TagsInput,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import type { FieldType } from '../api';
import {
  fieldFormSchema,
  fieldTypeOptions,
  needsOptions,
  type FieldFormValues,
} from '../schemas';

interface FieldFormProps {
  initialValues?: FieldFormValues;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: FieldFormValues) => void;
  onCancel?: () => void;
}

const emptyValues: FieldFormValues = {
  label: '',
  fieldType: 'text',
  isRequired: false,
  options: [],
};

export function FieldForm({
  initialValues,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: FieldFormProps) {
  const form = useForm<FieldFormValues>({
    initialValues: initialValues ?? emptyValues,
    validate: zod4Resolver(fieldFormSchema),
  });

  const fieldType = form.values.fieldType as FieldType;

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="sm">
        <TextInput label="Label" required {...form.getInputProps('label')} />
        <Select
          label="Field type"
          data={fieldTypeOptions}
          allowDeselect={false}
          {...form.getInputProps('fieldType')}
        />
        {needsOptions(fieldType) && (
          <TagsInput
            label="Options"
            description="Press Enter to add each option."
            {...form.getInputProps('options')}
          />
        )}
        <Switch
          label="Required"
          checked={form.values.isRequired}
          onChange={(event) =>
            form.setFieldValue('isRequired', event.currentTarget.checked)
          }
        />
        <Group justify="flex-end">
          {onCancel && (
            <Button variant="default" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
