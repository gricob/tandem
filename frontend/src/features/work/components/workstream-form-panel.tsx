import {
  Button,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect } from 'react';
import type { Workstream } from '../../workstreams/api';
import { useUpdateWorkstream } from '../../workstreams/queries';
import {
  workstreamSchema,
  type WorkstreamFormValues,
} from '../../workstreams/schemas';

interface WorkstreamFormPanelProps {
  workstream: Workstream;
}

export function WorkstreamFormPanel({ workstream }: WorkstreamFormPanelProps) {
  const updateWorkstream = useUpdateWorkstream(workstream.id);

  const form = useForm<WorkstreamFormValues>({
    initialValues: {
      name: workstream.name,
      description: workstream.description ?? '',
    },
    validate: zod4Resolver(workstreamSchema),
  });

  useEffect(() => {
    form.setValues({
      name: workstream.name,
      description: workstream.description ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workstream.id, workstream.name, workstream.description]);

  function handleSave(values: WorkstreamFormValues) {
    updateWorkstream.mutate({
      name: values.name,
      description: values.description || undefined,
    });
  }

  return (
    <Stack gap="lg" maw={520} p="lg">
      <Title order={4}>Workstream details</Title>
      <form onSubmit={form.onSubmit(handleSave)}>
        <Stack gap="sm">
          <TextInput label="Name" required {...form.getInputProps('name')} />
          <Textarea
            label="Description"
            {...form.getInputProps('description')}
          />
          <Group>
            <Button
              type="submit"
              size="xs"
              loading={updateWorkstream.isPending}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </form>
      <Text c="dimmed" size="sm">
        Select a deliverable from the list to see its details.
      </Text>
    </Stack>
  );
}
