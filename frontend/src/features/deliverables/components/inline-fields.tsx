import { Button, Group, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { ResponseFields } from '../../form-responses/components/response-fields';
import {
  useFormResponse,
  useSaveFormResponse,
} from '../../form-responses/queries';
import {
  buildChangedResponseData,
  buildInitialValues,
  type ResponseValues,
} from '../../form-responses/value-utils';
import type { FormField } from '../../forms/api';

interface InlineFieldsProps {
  formId: string;
  fields: FormField[];
}

export function InlineFields({ formId, fields }: InlineFieldsProps) {
  const { data: response, isPending } = useFormResponse(formId);
  const saveResponse = useSaveFormResponse(formId);
  const savedResponseData = response?.responseData ?? {};

  const form = useForm<ResponseValues>({
    initialValues: buildInitialValues(fields, savedResponseData),
  });

  useEffect(() => {
    form.setValues(buildInitialValues(fields, savedResponseData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  if (fields.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        This form template has no fields.
      </Text>
    );
  }

  if (isPending) {
    return (
      <Text c="dimmed" size="sm">
        Loading…
      </Text>
    );
  }

  function handleSubmit(values: ResponseValues) {
    const changed = buildChangedResponseData(values, savedResponseData);
    if (Object.keys(changed).length === 0) {
      return;
    }
    saveResponse.mutate(changed);
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <ResponseFields fields={fields} form={form} />
      <Group mt="sm">
        <Button type="submit" size="xs" loading={saveResponse.isPending}>
          Save
        </Button>
        {saveResponse.isSuccess && (
          <Text size="xs" c="dimmed">
            Saved
          </Text>
        )}
      </Group>
    </form>
  );
}
