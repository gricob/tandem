import {
  Alert,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { CreateUserStoryModal } from '../../deliverables/components/create-user-story-modal';
import { UserStoryList } from '../../deliverables/components/user-story-list';
import {
  useAddUserStory,
  useDeliverable,
  useUpdateDeliverable,
} from '../../deliverables/queries';
import {
  deliverableSchema,
  type DeliverableFormValues,
} from '../../deliverables/schemas';

interface DeliverableDetailPanelProps {
  deliverableId: string;
}

export function DeliverableDetailPanel({
  deliverableId,
}: DeliverableDetailPanelProps) {
  const {
    data: deliverable,
    isPending,
    isError,
  } = useDeliverable(deliverableId);
  const updateDeliverable = useUpdateDeliverable(deliverableId);
  const addUserStory = useAddUserStory(deliverableId);
  const [createUserStoryOpened, setCreateUserStoryOpened] = useState(false);

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
      <Text c="dimmed" p="lg">
        Loading deliverable…
      </Text>
    );
  }

  if (isError || !deliverable) {
    return (
      <Alert color="red" title="Couldn't load deliverable" m="lg">
        Something went wrong. Try refreshing the page.
      </Alert>
    );
  }

  function handleSaveDetails(values: DeliverableFormValues) {
    updateDeliverable.mutate({
      name: values.name,
      description: values.description || undefined,
    });
  }

  function handleCreateUserStory(
    values: Parameters<typeof addUserStory.mutate>[0],
  ) {
    addUserStory.mutate(values, {
      onSuccess: () => setCreateUserStoryOpened(false),
    });
  }

  return (
    <ScrollArea style={{ height: '100%' }}>
      <Stack gap="lg" maw={760} p="lg">
        <form onSubmit={form.onSubmit(handleSaveDetails)}>
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
                loading={updateDeliverable.isPending}
              >
                Save
              </Button>
            </Group>
          </Stack>
        </form>

        <div>
          <Group justify="space-between" mb="sm">
            <Title order={4}>User stories</Title>
            <Button size="xs" onClick={() => setCreateUserStoryOpened(true)}>
              + User story
            </Button>
          </Group>
          <UserStoryList
            deliverableId={deliverableId}
            userStories={deliverable.userStories}
          />
        </div>
      </Stack>

      <CreateUserStoryModal
        opened={createUserStoryOpened}
        submitting={addUserStory.isPending}
        onClose={() => setCreateUserStoryOpened(false)}
        onSubmit={handleCreateUserStory}
      />
    </ScrollArea>
  );
}
