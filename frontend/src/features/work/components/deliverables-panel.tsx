import { Button, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { CreateDeliverableModal } from '../../workstreams/components/create-deliverable-modal';
import { DeliverableList } from '../../workstreams/components/deliverable-list';
import type { Workstream } from '../../workstreams/api';
import { useAddDeliverable } from '../../workstreams/queries';
import type { CreateDeliverableFormValues } from '../../workstreams/schemas';

interface DeliverablesPanelProps {
  workstream: Workstream | null;
  isPending: boolean;
  selectedDeliverableId: string | null;
  onSelectDeliverable: (deliverableId: string) => void;
}

export function DeliverablesPanel({
  workstream,
  isPending,
  selectedDeliverableId,
  onSelectDeliverable,
}: DeliverablesPanelProps) {
  const [createOpened, setCreateOpened] = useState(false);
  const addDeliverable = useAddDeliverable(workstream?.id ?? '');

  function handleCreate(values: CreateDeliverableFormValues) {
    addDeliverable.mutate(values, {
      onSuccess: (created) => {
        setCreateOpened(false);
        onSelectDeliverable(created.id);
      },
    });
  }

  return (
    <Stack
      gap={0}
      w={340}
      style={{
        flex: 'none',
        borderRight: '1px solid var(--mantine-color-dark-6)',
        background: 'var(--mantine-color-dark-6)',
      }}
    >
      <Group justify="space-between" align="flex-start" p="sm" wrap="nowrap">
        <div style={{ minWidth: 0 }}>
          <Text fw={700} size="md" truncate>
            {workstream?.name ?? 'Select a workstream'}
          </Text>
          {workstream?.description && (
            <Text size="xs" c="dimmed" truncate>
              {workstream.description}
            </Text>
          )}
        </div>
        {workstream && (
          <Button
            size="xs"
            style={{ flex: 'none' }}
            onClick={() => setCreateOpened(true)}
          >
            New deliverable
          </Button>
        )}
      </Group>
      <ScrollArea style={{ flex: 1 }} px="sm" pb="sm">
        {isPending && (
          <Text c="dimmed" size="sm">
            Loading…
          </Text>
        )}
        {workstream && (
          <DeliverableList
            workstreamId={workstream.id}
            deliverables={workstream.deliverables}
            selectedId={selectedDeliverableId}
            onSelect={onSelectDeliverable}
          />
        )}
      </ScrollArea>

      {workstream && (
        <CreateDeliverableModal
          opened={createOpened}
          submitting={addDeliverable.isPending}
          onClose={() => setCreateOpened(false)}
          onSubmit={handleCreate}
        />
      )}
    </Stack>
  );
}
