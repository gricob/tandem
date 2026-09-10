import { Text } from '@mantine/core';
import type { Workstream } from '../../workstreams/api';
import { DeliverableDetailPanel } from './deliverable-detail-panel';
import { WorkstreamFormPanel } from './workstream-form-panel';

interface DetailPanelProps {
  workstream: Workstream | null;
  deliverableId: string | null;
}

export function DetailPanel({ workstream, deliverableId }: DetailPanelProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: 'var(--mantine-color-dark-7)',
      }}
    >
      {!workstream && (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text c="dimmed">Select a workstream to get started.</Text>
        </div>
      )}
      {workstream && deliverableId && (
        <DeliverableDetailPanel deliverableId={deliverableId} />
      )}
      {workstream && !deliverableId && (
        <WorkstreamFormPanel workstream={workstream} />
      )}
    </div>
  );
}
