import {
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import type { FormField } from '../../form-types/api';
import type { ResponseValues } from '../value-utils';

interface ResponseFieldsProps {
  fields: FormField[];
  form: UseFormReturnType<ResponseValues>;
}

export function ResponseFields({ fields, form }: ResponseFieldsProps) {
  return (
    <Stack gap="sm">
      {fields.map((field) => (
        <ResponseFieldInput key={field.id} field={field} form={form} />
      ))}
    </Stack>
  );
}

function ResponseFieldInput({
  field,
  form,
}: {
  field: FormField;
  form: UseFormReturnType<ResponseValues>;
}) {
  const label = field.isRequired ? `${field.label} *` : field.label;

  switch (field.fieldType) {
    case 'textarea':
      return <Textarea label={label} {...form.getInputProps(field.id)} />;
    case 'number':
      return <NumberInput label={label} {...form.getInputProps(field.id)} />;
    case 'boolean':
      return (
        <Switch
          label={label}
          checked={Boolean(form.values[field.id])}
          onChange={(event) =>
            form.setFieldValue(field.id, event.currentTarget.checked)
          }
        />
      );
    case 'select':
      return (
        <Select
          label={label}
          data={field.options ?? []}
          {...form.getInputProps(field.id)}
        />
      );
    case 'multi_select':
      return (
        <MultiSelect
          label={label}
          data={field.options ?? []}
          {...form.getInputProps(field.id)}
        />
      );
    case 'date':
      return (
        <TextInput
          type="date"
          label={label}
          {...form.getInputProps(field.id)}
        />
      );
    case 'text':
    default:
      return <TextInput label={label} {...form.getInputProps(field.id)} />;
  }
}
