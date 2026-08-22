import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import type { UserStory } from '../api';
import {
  useAddAcceptanceCriterion,
  useRemoveUserStory,
  useReorderUserStories,
  useUpdateUserStoryDetails,
} from '../queries';
import { deliverableSchema, type DeliverableFormValues } from '../schemas';
import { AcceptanceCriteriaList } from './acceptance-criteria-list';
import { CreateAcceptanceCriterionModal } from './create-acceptance-criterion-modal';
import { InlineFields } from './inline-fields';

interface UserStoryListProps {
  deliverableId: string;
  userStories: UserStory[];
}

export function UserStoryList({
  deliverableId,
  userStories,
}: UserStoryListProps) {
  const reorderUserStories = useReorderUserStories(deliverableId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = userStories.findIndex((story) => story.id === active.id);
    const newIndex = userStories.findIndex((story) => story.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = [...userStories];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderUserStories.mutate(reordered.map((story) => story.id));
  }

  if (userStories.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No user stories yet. Add one above.
      </Text>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={userStories.map((story) => story.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack gap="sm">
          {userStories.map((story) => (
            <SortableUserStoryCard
              key={story.id}
              deliverableId={deliverableId}
              userStory={story}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}

interface SortableUserStoryCardProps {
  deliverableId: string;
  userStory: UserStory;
}

function SortableUserStoryCard({
  deliverableId,
  userStory,
}: SortableUserStoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: userStory.id });
  const removeUserStory = useRemoveUserStory(deliverableId);
  const addAcceptanceCriterion = useAddAcceptanceCriterion(
    deliverableId,
    userStory.id,
  );
  const updateDetails = useUpdateUserStoryDetails(deliverableId, userStory.id);
  const [createAcceptanceCriterionOpened, setCreateAcceptanceCriterionOpened] =
    useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const detailsForm = useForm<DeliverableFormValues>({
    initialValues: {
      name: userStory.name,
      description: userStory.description ?? '',
    },
    validate: zod4Resolver(deliverableSchema),
  });

  useEffect(() => {
    detailsForm.setValues({
      name: userStory.name,
      description: userStory.description ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userStory.id, userStory.name, userStory.description]);

  function handleCreateAcceptanceCriterion(
    values: Parameters<typeof addAcceptanceCriterion.mutate>[0],
  ) {
    addAcceptanceCriterion.mutate(values, {
      onSuccess: () => setCreateAcceptanceCriterionOpened(false),
    });
  }

  function handleSaveDetails(values: DeliverableFormValues) {
    updateDetails.mutate(
      { name: values.name, description: values.description || undefined },
      { onSuccess: () => setIsEditingDetails(false) },
    );
  }

  function handleCancelEditDetails() {
    detailsForm.setValues({
      name: userStory.name,
      description: userStory.description ?? '',
    });
    setIsEditingDetails(false);
  }

  return (
    <Paper ref={setNodeRef} style={style} withBorder p="md">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group
          wrap="nowrap"
          align="flex-start"
          style={{ flex: 1, minWidth: 0 }}
        >
          <ActionIcon
            variant="subtle"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${userStory.name}`}
            style={{ cursor: 'grab' }}
          >
            ⠿
          </ActionIcon>
          <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
            {isEditingDetails ? (
              <form onSubmit={detailsForm.onSubmit(handleSaveDetails)}>
                <Group align="flex-end" wrap="nowrap">
                  <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                    <TextInput
                      size="sm"
                      aria-label="Name"
                      placeholder="Name"
                      required
                      {...detailsForm.getInputProps('name')}
                    />
                    <Textarea
                      size="sm"
                      aria-label="Description"
                      placeholder="Description"
                      autosize
                      minRows={1}
                      {...detailsForm.getInputProps('description')}
                    />
                  </Stack>
                  <Button
                    type="submit"
                    size="xs"
                    variant="subtle"
                    loading={updateDetails.isPending}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="subtle"
                    color="gray"
                    onClick={handleCancelEditDetails}
                  >
                    Cancel
                  </Button>
                </Group>
              </form>
            ) : (
              <Group wrap="nowrap" align="flex-start" gap="xs">
                <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                  <Text fw={600} truncate>
                    {userStory.name}
                  </Text>
                  {userStory.description && (
                    <Text size="sm" c="dimmed">
                      {userStory.description}
                    </Text>
                  )}
                </Stack>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => setIsEditingDetails(true)}
                  aria-label={`Edit ${userStory.name}`}
                >
                  ✎
                </ActionIcon>
              </Group>
            )}
            <Text size="xs" c="dimmed">
              Template: {userStory.formTemplateName ?? '— deleted —'}
            </Text>
          </Stack>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={() => removeUserStory.mutate(userStory.id)}
          aria-label={`Remove ${userStory.name}`}
        >
          🗑
        </ActionIcon>
      </Group>

      <InlineFields formId={userStory.id} fields={userStory.fields} />

      <Divider my="sm" />

      <Group justify="space-between" mb="xs">
        <Title order={6}>Acceptance Criteria</Title>
        <Button
          variant="subtle"
          size="xs"
          onClick={() => setCreateAcceptanceCriterionOpened(true)}
        >
          + Acceptance criterion
        </Button>
      </Group>

      <AcceptanceCriteriaList
        deliverableId={deliverableId}
        userStoryId={userStory.id}
        acceptanceCriteria={userStory.acceptanceCriteria}
      />

      <CreateAcceptanceCriterionModal
        opened={createAcceptanceCriterionOpened}
        submitting={addAcceptanceCriterion.isPending}
        onClose={() => setCreateAcceptanceCriterionOpened(false)}
        onSubmit={handleCreateAcceptanceCriterion}
      />
    </Paper>
  );
}
