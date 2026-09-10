import {
  ActionIcon,
  Alert,
  Group,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useState } from 'react';
import { CreateWorkstreamModal } from '../../workstreams/components/create-workstream-modal';
import type { Workstream } from '../../workstreams/api';
import { useCreateWorkstream } from '../../workstreams/queries';
import type { WorkstreamFormValues } from '../../workstreams/schemas';

interface WorkstreamsPanelProps {
  workstreams: Workstream[];
  isPending: boolean;
  isError: boolean;
  selectedId: string | null;
  onSelect: (workstreamId: string) => void;
}

export function WorkstreamsPanel({
  workstreams,
  isPending,
  isError,
  selectedId,
  onSelect,
}: WorkstreamsPanelProps) {
  const createWorkstream = useCreateWorkstream();
  const [createOpened, setCreateOpened] = useState(false);

  function handleCreate(values: WorkstreamFormValues) {
    createWorkstream.mutate(
      { name: values.name, description: values.description || undefined },
      {
        onSuccess: (created) => {
          setCreateOpened(false);
          onSelect(created.id);
        },
      },
    );
  }

  return (
    <Stack
      gap={0}
      w={246}
      style={{
        flex: 'none',
        borderRight: '1px solid var(--mantine-color-dark-6)',
        background: 'var(--mantine-color-dark-8)',
      }}
    >
      <Group justify="space-between" p="sm">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          Workstreams
        </Text>
        <ActionIcon
          variant="light"
          size="sm"
          onClick={() => setCreateOpened(true)}
          aria-label="New workstream"
        >
          +
        </ActionIcon>
      </Group>
      <ScrollArea style={{ flex: 1 }} px="xs" pb="sm">
        {isPending && (
          <Text c="dimmed" size="sm" p="sm">
            Loading…
          </Text>
        )}
        {isError && (
          <Alert color="red" m="sm">
            Couldn&apos;t load workstreams.
          </Alert>
        )}
        {!isPending && !isError && workstreams.length === 0 && (
          <Text c="dimmed" size="sm" p="sm">
            No workstreams yet.
          </Text>
        )}
        <Stack gap={2}>
          {workstreams.map((workstream) => (
            <WorkstreamRow
              key={workstream.id}
              workstream={workstream}
              active={workstream.id === selectedId}
              onSelect={() => onSelect(workstream.id)}
            />
          ))}
        </Stack>
      </ScrollArea>

      <CreateWorkstreamModal
        opened={createOpened}
        submitting={createWorkstream.isPending}
        onClose={() => setCreateOpened(false)}
        onSubmit={handleCreate}
      />
    </Stack>
  );
}

interface WorkstreamRowProps {
  workstream: Workstream;
  active: boolean;
  onSelect: () => void;
}

function WorkstreamRow({ workstream, active, onSelect }: WorkstreamRowProps) {
  return (
    <Group
      wrap="nowrap"
      gap={4}
      style={{
        borderRadius: 8,
        background: active ? 'var(--mantine-color-accent-6)' : 'transparent',
      }}
    >
      <UnstyledButton
        onClick={onSelect}
        style={{ flex: 1, minWidth: 0, padding: '8px 6px 8px 10px' }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Text
            size="sm"
            fw={500}
            c={active ? 'white' : undefined}
            truncate
            style={{ flex: 1 }}
          >
            {workstream.name}
          </Text>
          <Text size="xs" c={active ? 'white' : 'dimmed'}>
            {workstream.deliverables.length}
          </Text>
        </Group>
      </UnstyledButton>
    </Group>
  );
}
