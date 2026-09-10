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
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import type { Deliverable } from '../../deliverables/api';
import { useReorderDeliverables } from '../queries';

interface DeliverableListProps {
  workstreamId: string;
  deliverables: Deliverable[];
  selectedId?: string | null;
  onSelect: (deliverableId: string) => void;
}

export function DeliverableList({
  workstreamId,
  deliverables,
  selectedId,
  onSelect,
}: DeliverableListProps) {
  const reorderDeliverables = useReorderDeliverables(workstreamId);

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
              selected={deliverable.id === selectedId}
              onSelect={() => onSelect(deliverable.id)}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}

interface SortableDeliverableCardProps {
  deliverable: Deliverable;
  selected?: boolean;
  onSelect: () => void;
}

function SortableDeliverableCard({
  deliverable,
  selected,
  onSelect,
}: SortableDeliverableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deliverable.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: selected ? 'rgba(10, 132, 255, 0.14)' : undefined,
    borderColor: selected ? 'var(--mantine-color-accent-6)' : undefined,
  };

  return (
    <Paper ref={setNodeRef} style={style} withBorder p="md">
      <Group wrap="nowrap" align="flex-start">
        <ActionIcon
          variant="subtle"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${deliverable.name}`}
          style={{ cursor: 'grab' }}
        >
          ⠿
        </ActionIcon>
        <UnstyledButton onClick={onSelect} style={{ flex: 1, minWidth: 0 }}>
          <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
            <Text fw={600} truncate>
              {deliverable.name}
            </Text>
            {deliverable.description && (
              <Text size="sm" c="dimmed">
                {deliverable.description}
              </Text>
            )}
          </Stack>
        </UnstyledButton>
      </Group>
    </Paper>
  );
}
