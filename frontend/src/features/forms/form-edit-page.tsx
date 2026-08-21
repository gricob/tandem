import {
  Alert,
  Anchor,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useParams } from '@tanstack/react-router';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect } from 'react';
import { useForm as useFormQuery, useUpdateForm } from './queries';
import { editFormSchema, type EditFormFormValues } from './schemas';

export function FormEditPage() {
  const { formId } = useParams({ from: '/forms/$formId' });
  const { data: form, isPending, isError } = useFormQuery(formId);

  const updateForm = useUpdateForm(formId);

  const editForm = useForm<EditFormFormValues>({
    initialValues: { name: '', description: '' },
    validate: zod4Resolver(editFormSchema),
  });

  useEffect(() => {
    if (form) {
      editForm.setValues({
        name: form.name,
        description: form.description ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.id, form?.name, form?.description]);

  if (isPending) {
    return (
      <Container py="xl">
        <Text c="dimmed">Loading form…</Text>
      </Container>
    );
  }

  if (isError || !form) {
    return (
      <Container py="xl">
        <Alert color="red" title="Couldn't load form">
          Something went wrong. Try refreshing the page.
        </Alert>
      </Container>
    );
  }

  function handleSaveDetails(values: EditFormFormValues) {
    updateForm.mutate({
      name: values.name,
      description: values.description || undefined,
    });
  }

  return (
    <Container py="xl">
      <Link to="/forms">
        <Anchor component="span" size="sm">
          ← Forms
        </Anchor>
      </Link>

      <Title order={1} mt="xs" mb="lg">
        Edit form
      </Title>

      <Stack gap="lg" maw={480}>
        <TextInput
          label="Form template"
          value={form.formTemplateName ?? '— deleted —'}
          disabled
        />

        <form onSubmit={editForm.onSubmit(handleSaveDetails)}>
          <Stack gap="sm">
            <TextInput
              label="Name"
              required
              {...editForm.getInputProps('name')}
            />
            <Textarea
              label="Description"
              {...editForm.getInputProps('description')}
            />
            <Group>
              <Button type="submit" loading={updateForm.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>

        <Group>
          <Link to="/forms/$formId/fill" params={{ formId }}>
            <Button component="span" variant="light">
              Fill in form
            </Button>
          </Link>
          <Link to="/forms/$formId/response" params={{ formId }}>
            <Button component="span" variant="light">
              View response
            </Button>
          </Link>
        </Group>
      </Stack>
    </Container>
  );
}
