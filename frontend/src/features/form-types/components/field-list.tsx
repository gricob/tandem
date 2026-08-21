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
import { ActionIcon, Badge, Group, Paper, Stack, Text } from '@mantine/core';
import type { FormField } from '../api';
import { fieldTypeOptions } from '../schemas';

interface FieldListProps {
  fields: FormField[];
  onReorder: (fieldIds: string[]) => void;
  onEdit: (field: FormField) => void;
  onRemove: (field: FormField) => void;
}

export function FieldList({
  fields,
  onReorder,
  onEdit,
  onRemove,
}: FieldListProps) {
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

    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = [...fields];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered.map((field) => field.id));
  }

  if (fields.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No fields yet. Add one below.
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
        items={fields.map((field) => field.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack gap="xs">
          {fields.map((field) => (
            <SortableFieldRow
              key={field.id}
              field={field}
              onEdit={() => onEdit(field)}
              onRemove={() => onRemove(field)}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}

interface SortableFieldRowProps {
  field: FormField;
  onEdit: () => void;
  onRemove: () => void;
}

function SortableFieldRow({ field, onEdit, onRemove }: SortableFieldRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldTypeLabel =
    fieldTypeOptions.find((option) => option.value === field.fieldType)
      ?.label ?? field.fieldType;

  return (
    <Paper ref={setNodeRef} style={style} withBorder p="sm">
      <Group justify="space-between" wrap="nowrap">
        <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <ActionIcon
            variant="subtle"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${field.label}`}
            style={{ cursor: 'grab' }}
          >
            ⠿
          </ActionIcon>
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Text fw={500} truncate>
              {field.label}
            </Text>
            <Group gap="xs">
              <Badge size="sm" variant="light">
                {fieldTypeLabel}
              </Badge>
              {field.isRequired && (
                <Badge size="sm" variant="light" color="orange">
                  Required
                </Badge>
              )}
              {field.options && field.options.length > 0 && (
                <Text size="xs" c="dimmed" truncate>
                  {field.options.join(', ')}
                </Text>
              )}
            </Group>
          </Stack>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            onClick={onEdit}
            aria-label={`Edit ${field.label}`}
          >
            ✎
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={onRemove}
            aria-label={`Remove ${field.label}`}
          >
            🗑
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}
