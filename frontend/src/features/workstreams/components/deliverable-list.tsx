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
import { ActionIcon, Anchor, Group, Paper, Stack, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { Deliverable } from '../../deliverables/api';
import { useRemoveDeliverable, useReorderDeliverables } from '../queries';

interface DeliverableListProps {
  workstreamId: string;
  deliverables: Deliverable[];
}

export function DeliverableList({
  workstreamId,
  deliverables,
}: DeliverableListProps) {
  const reorderDeliverables = useReorderDeliverables(workstreamId);
  const removeDeliverable = useRemoveDeliverable(workstreamId);

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

    const oldIndex = deliverables.findIndex((d) => d.id === active.id);
    const newIndex = deliverables.findIndex((d) => d.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = [...deliverables];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderDeliverables.mutate(reordered.map((d) => d.id));
  }

  if (deliverables.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No deliverables yet. Add one above.
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
        items={deliverables.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack gap="sm">
          {deliverables.map((deliverable) => (
            <SortableDeliverableCard
              key={deliverable.id}
              deliverable={deliverable}
              onRemove={() => removeDeliverable.mutate(deliverable.id)}
              removing={
                removeDeliverable.isPending &&
                removeDeliverable.variables === deliverable.id
              }
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}

interface SortableDeliverableCardProps {
  deliverable: Deliverable;
  onRemove: () => void;
  removing?: boolean;
}

function SortableDeliverableCard({
  deliverable,
  onRemove,
  removing,
}: SortableDeliverableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deliverable.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper ref={setNodeRef} style={style} withBorder p="md">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group wrap="nowrap" align="flex-start" style={{ flex: 1, minWidth: 0 }}>
          <ActionIcon
            variant="subtle"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${deliverable.name}`}
            style={{ cursor: 'grab' }}
          >
            ⠿
          </ActionIcon>
          <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
            <Link
              to="/deliverables/$deliverableId"
              params={{ deliverableId: deliverable.id }}
            >
              <Anchor component="span" fw={600} truncate>
                {deliverable.name}
              </Anchor>
            </Link>
            {deliverable.description && (
              <Text size="sm" c="dimmed">
                {deliverable.description}
              </Text>
            )}
          </Stack>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          loading={removing}
          onClick={onRemove}
          aria-label={`Remove ${deliverable.name}`}
        >
          🗑
        </ActionIcon>
      </Group>
    </Paper>
  );
}
