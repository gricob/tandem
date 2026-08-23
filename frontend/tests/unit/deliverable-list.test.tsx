import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Deliverable } from '../../src/features/deliverables/api';
import { DeliverableList } from '../../src/features/workstreams/components/deliverable-list';

const removeDeliverableMutate = vi.fn();
const reorderDeliverablesMutate = vi.fn();

vi.mock('../../src/features/workstreams/queries', () => ({
  useRemoveDeliverable: () => ({
    mutate: removeDeliverableMutate,
    isPending: false,
    variables: undefined,
  }),
  useReorderDeliverables: () => ({ mutate: reorderDeliverablesMutate }),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

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
      <DeliverableList workstreamId="workstream-1" deliverables={deliverables} />
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

  it('removes a deliverable when its remove button is clicked', async () => {
    renderList([deliverable]);

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Reporting dashboard' }),
    );

    expect(removeDeliverableMutate).toHaveBeenCalledWith('deliverable-1');
  });
});
