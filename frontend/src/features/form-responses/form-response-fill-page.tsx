import {
  Alert,
  Anchor,
  Button,
  Container,
  Group,
  Text,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { Form } from '../forms/api';
import { resolveVisibility, type ConditionNode } from '../forms/condition';
import { useForm as useFormQuery } from '../forms/queries';
import { ResponseFields } from './components/response-fields';
import type { FormResponse } from './api';
import { useFormResponse, useSaveFormResponse } from './queries';
import {
  buildChangedResponseData,
  buildInitialValues,
  isEmptyValue,
  type ResponseValues,
} from './value-utils';

export function FormResponseFillPage() {
  const { formId } = useParams({ from: '/forms/$formId/fill' });
  const {
    data: form,
    isPending: formPending,
    isError: formError,
  } = useFormQuery(formId);
  const {
    data: response,
    isPending: responsePending,
    isError: responseError,
  } = useFormResponse(formId);

  if (formPending || responsePending) {
    return (
      <Container py="xl">
        <Text c="dimmed">Loading form…</Text>
      </Container>
    );
  }

  if (formError || responseError || !form) {
    return (
      <Container py="xl">
        <Alert color="red" title="Couldn't load form">
          Something went wrong. Try refreshing the page.
        </Alert>
      </Container>
    );
  }

  return (
    <FormResponseFillForm
      formId={formId}
      form={form}
      response={response ?? null}
    />
  );
}

interface FormResponseFillFormProps {
  formId: string;
  form: Form;
  response: FormResponse | null;
}

function FormResponseFillForm({
  formId,
  form,
  response,
}: FormResponseFillFormProps) {
  const saveResponse = useSaveFormResponse(formId);
  const fields = form.fields;
  const savedResponseData = response?.responseData ?? {};

  const responseForm = useForm<ResponseValues>({
    initialValues: buildInitialValues(fields, savedResponseData),
  });

  useEffect(() => {
    responseForm.setValues(buildInitialValues(fields, savedResponseData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const visibility = resolveVisibility(
    fields.map((field) => ({
      id: field.id,
      condition: field.condition as ConditionNode | null,
    })),
    savedResponseData,
  );
  const missingRequiredFields = fields.filter(
    (field) =>
      field.isRequired &&
      visibility.get(field.id) &&
      isEmptyValue(savedResponseData[field.id]),
  );

  function handleSubmit(values: ResponseValues) {
    const changed = buildChangedResponseData(values, savedResponseData);
    if (Object.keys(changed).length === 0) {
      return;
    }
    saveResponse.mutate(changed);
  }

  return (
    <Container py="xl">
      <Link to="/forms/$formId" params={{ formId }}>
        <Anchor component="span" size="sm">
          ← {form.name}
        </Anchor>
      </Link>

      <Title order={1} mt="xs" mb="lg">
        Fill in: {form.name}
      </Title>

      {missingRequiredFields.length > 0 && (
        <Alert color="yellow" title="Missing required fields" mb="md">
          {missingRequiredFields.map((field) => field.label).join(', ')}
        </Alert>
      )}

      <form onSubmit={responseForm.onSubmit(handleSubmit)}>
        <ResponseFields fields={fields} form={responseForm} />
        <Group mt="lg">
          <Button type="submit" loading={saveResponse.isPending}>
            Save
          </Button>
          {saveResponse.isSuccess && <Text c="dimmed">Saved</Text>}
        </Group>
      </form>
    </Container>
  );
}
