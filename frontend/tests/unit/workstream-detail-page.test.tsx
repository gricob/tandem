import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Workstream } from '../../src/features/workstreams/api';
import { WorkstreamDetailPage } from '../../src/features/workstreams/workstream-detail-page';

const useWorkstreamMock = vi.fn();
const updateWorkstreamMutate = vi.fn();
const addDeliverableMutate = vi.fn(
  (_values: unknown, options?: { onSuccess?: () => void }) => {
    options?.onSuccess?.();
  },
);

vi.mock('../../src/features/workstreams/queries', () => ({
  useWorkstream: () => useWorkstreamMock(),
  useUpdateWorkstream: () => ({
    mutate: updateWorkstreamMutate,
    isPending: false,
  }),
  useAddDeliverable: () => ({
    mutate: addDeliverableMutate,
    isPending: false,
  }),
}));

vi.mock('../../src/features/workstreams/components/deliverable-list', () => ({
  DeliverableList: () => null,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => <>{children}</>,
    useParams: () => ({ workstreamId: 'workstream-1' }),
  };
});

const workstream: Workstream = {
  id: 'workstream-1',
  name: 'Platform',
  description: 'Core platform work',
  createdAt: '',
  updatedAt: '',
  deliverables: [],
};

function renderPage() {
  render(
    <MantineProvider>
      <WorkstreamDetailPage />
    </MantineProvider>,
  );
}

describe('WorkstreamDetailPage', () => {
  it('shows a loading state', () => {
    useWorkstreamMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });
    renderPage();

    expect(screen.getByText('Loading workstream…')).toBeInTheDocument();
  });

  it("pre-fills the form with the workstream's name and description", () => {
    useWorkstreamMock.mockReturnValue({
      data: workstream,
      isPending: false,
      isError: false,
    });
    renderPage();

    expect(screen.getByDisplayValue('Platform')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Core platform work')).toBeInTheDocument();
  });

  it('saves edited name and description', async () => {
    useWorkstreamMock.mockReturnValue({
      data: workstream,
      isPending: false,
      isError: false,
    });
    renderPage();

    const nameInput = screen.getByDisplayValue('Platform');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Platform v2');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateWorkstreamMutate).toHaveBeenCalledWith({
      name: 'Platform v2',
      description: 'Core platform work',
    });
  });

  it('opens the "New deliverable" modal and submits a new deliverable', async () => {
    useWorkstreamMock.mockReturnValue({
      data: workstream,
      isPending: false,
      isError: false,
    });
    renderPage();

    await userEvent.click(
      screen.getByRole('button', { name: 'New deliverable' }),
    );
    const modal = await screen.findByRole('dialog');
    const nameInput = modal.querySelector('[data-path="name"]');
    if (!nameInput) {
      throw new Error('No input found for data-path="name"');
    }
    await userEvent.type(nameInput as HTMLElement, 'Reporting dashboard');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(addDeliverableMutate).toHaveBeenCalledWith(
      { name: 'Reporting dashboard', description: '' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
