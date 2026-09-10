import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Deliverable } from '../../src/features/deliverables/api';
import { DeliverableList } from '../../src/features/workstreams/components/deliverable-list';

const reorderDeliverablesMutate = vi.fn();
const onSelect = vi.fn();

vi.mock('../../src/features/workstreams/queries', () => ({
  useReorderDeliverables: () => ({ mutate: reorderDeliverablesMutate }),
}));

const deliverable: Deliverable = {
  id: 'deliverable-1',
  workstreamId: 'workstream-1',
  orderIndex: 0,
  name: 'Reporting dashboard',
  description: 'Internal metrics',
  createdAt: '',
  updatedAt: '',
  userStories: [],
};

function renderList(deliverables: Deliverable[]) {
  render(
    <MantineProvider>
      <DeliverableList
        workstreamId="workstream-1"
        deliverables={deliverables}
        onSelect={onSelect}
      />
    </MantineProvider>,
  );
}

describe('DeliverableList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a message when there are no deliverables', () => {
    renderList([]);

    expect(
      screen.getByText('No deliverables yet. Add one above.'),
    ).toBeInTheDocument();
  });

  it('renders a deliverable with its name and description', () => {
    renderList([deliverable]);

    expect(screen.getByText('Reporting dashboard')).toBeInTheDocument();
    expect(screen.getByText('Internal metrics')).toBeInTheDocument();
  });

  it('selects a deliverable when it is clicked', async () => {
    renderList([deliverable]);

    await userEvent.click(screen.getByText('Reporting dashboard'));

    expect(onSelect).toHaveBeenCalledWith('deliverable-1');
  });
});
