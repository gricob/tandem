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
import { useEffect, useState } from 'react';
import { CreateDeliverableModal } from './components/create-deliverable-modal';
import { DeliverableList } from './components/deliverable-list';
import { useAddDeliverable, useUpdateWorkstream, useWorkstream } from './queries';
import { workstreamSchema, type WorkstreamFormValues } from './schemas';

export function WorkstreamDetailPage() {
  const { workstreamId } = useParams({ from: '/workstreams/$workstreamId' });
  const {
    data: workstream,
    isPending,
    isError,
  } = useWorkstream(workstreamId);

  const updateWorkstream = useUpdateWorkstream(workstreamId);
  const addDeliverable = useAddDeliverable(workstreamId);
  const [createDeliverableOpened, setCreateDeliverableOpened] =
    useState(false);

  const form = useForm<WorkstreamFormValues>({
    initialValues: { name: '', description: '' },
    validate: zod4Resolver(workstreamSchema),
  });

  useEffect(() => {
    if (workstream) {
      form.setValues({
        name: workstream.name,
        description: workstream.description ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workstream?.id, workstream?.name, workstream?.description]);

  if (isPending) {
    return (
      <Container py="xl">
        <Text c="dimmed">Loading workstream…</Text>
      </Container>
    );
  }

  if (isError || !workstream) {
    return (
      <Container py="xl">
        <Alert color="red" title="Couldn't load workstream">
          Something went wrong. Try refreshing the page.
        </Alert>
      </Container>
    );
  }

  function handleSaveDetails(values: WorkstreamFormValues) {
    updateWorkstream.mutate({
      name: values.name,
      description: values.description || undefined,
    });
  }

  function handleCreateDeliverable(
    values: Parameters<typeof addDeliverable.mutate>[0],
  ) {
    addDeliverable.mutate(values, {
      onSuccess: () => setCreateDeliverableOpened(false),
    });
  }

  return (
    <Container py="xl">
      <Link to="/workstreams">
        <Anchor component="span" size="sm">
          ← Workstreams
        </Anchor>
      </Link>

      <Title order={1} mt="xs" mb="lg">
        Edit workstream
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
              <Button type="submit" loading={updateWorkstream.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>

        <div>
          <Group justify="space-between" mb="sm">
            <Title order={2}>Deliverables</Title>
            <Button onClick={() => setCreateDeliverableOpened(true)}>
              New deliverable
            </Button>
          </Group>

          <DeliverableList
            workstreamId={workstreamId}
            deliverables={workstream.deliverables}
          />
        </div>
      </Stack>

      <CreateDeliverableModal
        opened={createDeliverableOpened}
        submitting={addDeliverable.isPending}
        onClose={() => setCreateDeliverableOpened(false)}
        onSubmit={handleCreateDeliverable}
      />
    </Container>
  );
}
