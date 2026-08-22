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
import { ActionIcon, Group, Paper, Stack, Text } from '@mantine/core';
import type { AcceptanceCriterion } from '../api';
import {
  useRemoveAcceptanceCriterion,
  useReorderAcceptanceCriteria,
} from '../queries';
import { InlineFields } from './inline-fields';

interface AcceptanceCriteriaListProps {
  deliverableId: string;
  userStoryId: string;
  acceptanceCriteria: AcceptanceCriterion[];
}

export function AcceptanceCriteriaList({
  deliverableId,
  userStoryId,
  acceptanceCriteria,
}: AcceptanceCriteriaListProps) {
  const reorderAcceptanceCriteria = useReorderAcceptanceCriteria(
    deliverableId,
    userStoryId,
  );

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

    const oldIndex = acceptanceCriteria.findIndex(
      (criterion) => criterion.id === active.id,
    );
    const newIndex = acceptanceCriteria.findIndex(
      (criterion) => criterion.id === over.id,
    );
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = [...acceptanceCriteria];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderAcceptanceCriteria.mutate(
      reordered.map((criterion) => criterion.id),
    );
  }

  if (acceptanceCriteria.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No acceptance criteria yet.
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
        items={acceptanceCriteria.map((criterion) => criterion.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack gap="xs">
          {acceptanceCriteria.map((criterion) => (
            <SortableAcceptanceCriterionRow
              key={criterion.id}
              deliverableId={deliverableId}
              userStoryId={userStoryId}
              acceptanceCriterion={criterion}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}

interface SortableAcceptanceCriterionRowProps {
  deliverableId: string;
  userStoryId: string;
  acceptanceCriterion: AcceptanceCriterion;
}

function SortableAcceptanceCriterionRow({
  deliverableId,
  userStoryId,
  acceptanceCriterion,
}: SortableAcceptanceCriterionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: acceptanceCriterion.id });
  const removeAcceptanceCriterion = useRemoveAcceptanceCriterion(
    deliverableId,
    userStoryId,
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const templateLabel = acceptanceCriterion.formTemplateName ?? '— deleted —';

  return (
    <Paper ref={setNodeRef} style={style} withBorder p="sm">
      <Group justify="space-between" wrap="nowrap" align="center">
        <Group wrap="nowrap" align="center" style={{ flex: 1, minWidth: 0 }}>
          <ActionIcon
            variant="subtle"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${templateLabel}`}
            style={{ cursor: 'grab' }}
          >
            ⠿
          </ActionIcon>
          <Text size="sm" fw={500} truncate>
            {templateLabel}
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={() =>
            removeAcceptanceCriterion.mutate(acceptanceCriterion.id)
          }
          aria-label={`Remove ${templateLabel}`}
        >
          🗑
        </ActionIcon>
      </Group>
      <InlineFields
        formId={acceptanceCriterion.id}
        fields={acceptanceCriterion.fields}
      />
    </Paper>
  );
}
