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
import { useDeliverable, useUpdateDeliverable } from './queries';
import { deliverableSchema, type DeliverableFormValues } from './schemas';

export function DeliverableEditPage() {
  const { deliverableId } = useParams({ from: '/deliverables/$deliverableId' });
  const { data: deliverable, isPending, isError } =
    useDeliverable(deliverableId);

  const updateDeliverable = useUpdateDeliverable(deliverableId);

  const form = useForm<DeliverableFormValues>({
    initialValues: { name: '', description: '' },
    validate: zod4Resolver(deliverableSchema),
  });

  useEffect(() => {
    if (deliverable) {
      form.setValues({
        name: deliverable.name,
        description: deliverable.description ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverable?.id, deliverable?.name, deliverable?.description]);

  if (isPending) {
    return (
      <Container py="xl">
        <Text c="dimmed">Loading deliverable…</Text>
      </Container>
    );
  }

  if (isError || !deliverable) {
    return (
      <Container py="xl">
        <Alert color="red" title="Couldn't load deliverable">
          Something went wrong. Try refreshing the page.
        </Alert>
      </Container>
    );
  }

  function handleSaveDetails(values: DeliverableFormValues) {
    updateDeliverable.mutate({
      name: values.name,
      description: values.description || undefined,
    });
  }

  return (
    <Container py="xl">
      <Link to="/deliverables">
        <Anchor component="span" size="sm">
          ← Deliverables
        </Anchor>
      </Link>

      <Title order={1} mt="xs" mb="lg">
        Edit deliverable
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
              <Button type="submit" loading={updateDeliverable.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
