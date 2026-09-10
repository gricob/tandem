import { Group } from '@mantine/core';
import { getRouteApi } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useWorkstream, useWorkstreams } from '../workstreams/queries';
import { DeliverablesPanel } from './components/deliverables-panel';
import { DetailPanel } from './components/detail-panel';
import { WorkstreamsPanel } from './components/workstreams-panel';

const routeApi = getRouteApi('/work');

export function WorkPage() {
  const { ws, del } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const {
    data: workstreams,
    isPending: isWorkstreamsPending,
    isError: isWorkstreamsError,
  } = useWorkstreams();

  const selectedWorkstreamId = ws ?? workstreams?.[0]?.id ?? null;
  const { data: workstream, isPending: isWorkstreamPending } = useWorkstream(
    selectedWorkstreamId ?? '',
    { enabled: !!selectedWorkstreamId },
  );

  // Self-heal a `del` selection that no longer exists on the loaded
  // workstream (e.g. it was just removed, or a stale/foreign id was
  // deep-linked) instead of leaving the detail panel pointed at nothing.
  useEffect(() => {
    if (!workstream || !del) {
      return;
    }
    const stillExists = workstream.deliverables.some((d) => d.id === del);
    if (!stillExists) {
      void navigate({ search: { ws: workstream.id, del: undefined } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workstream, del]);

  function selectWorkstream(workstreamId: string) {
    void navigate({ search: { ws: workstreamId, del: undefined } });
  }

  function selectDeliverable(deliverableId: string | undefined) {
    if (!selectedWorkstreamId) {
      return;
    }
    void navigate({
      search: { ws: selectedWorkstreamId, del: deliverableId },
    });
  }

  return (
    <Group
      align="stretch"
      gap={0}
      wrap="nowrap"
      style={{ height: 'calc(100vh - 60px)' }}
    >
      <WorkstreamsPanel
        workstreams={workstreams ?? []}
        isPending={isWorkstreamsPending}
        isError={isWorkstreamsError}
        selectedId={selectedWorkstreamId}
        onSelect={selectWorkstream}
      />
      <DeliverablesPanel
        workstream={workstream ?? null}
        isPending={!!selectedWorkstreamId && isWorkstreamPending}
        selectedDeliverableId={del ?? null}
        onSelectDeliverable={selectDeliverable}
      />
      <DetailPanel
        workstream={workstream ?? null}
        deliverableId={del ?? null}
      />
    </Group>
  );
}
