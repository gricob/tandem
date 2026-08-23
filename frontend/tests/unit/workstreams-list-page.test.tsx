import { MantineProvider } from '@mantine/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { WorkstreamsListPage } from '../../src/features/workstreams/workstreams-list-page';

const useWorkstreamsMock = vi.fn();
const createWorkstreamMutate = vi.fn();
const deleteWorkstreamMutate = vi.fn(
  (_id: string, options?: { onSuccess?: () => void }) => {
    options?.onSuccess?.();
  },
);

vi.mock('../../src/features/workstreams/queries', () => ({
  useWorkstreams: () => useWorkstreamsMock(),
  useCreateWorkstream: () => ({
    mutate: createWorkstreamMutate,
    isPending: false,
  }),
  useDeleteWorkstream: () => ({
    mutate: deleteWorkstreamMutate,
    isPending: false,
  }),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => <>{children}</>,
    useNavigate: () => vi.fn(),
  };
});

const workstreams = [
  {
    id: 'workstream-1',
    name: 'Platform',
    description: 'Core platform work',
    createdAt: '',
    updatedAt: '',
    deliverables: [],
  },
];

function renderPage() {
  render(
    <MantineProvider>
      <WorkstreamsListPage />
    </MantineProvider>,
  );
}

describe('WorkstreamsListPage', () => {
  it('lists workstreams with their name and description', () => {
    useWorkstreamsMock.mockReturnValue({
      data: workstreams,
      isPending: false,
      isError: false,
    });
    renderPage();

    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Core platform work')).toBeInTheDocument();
  });

  it('shows an empty state when there are no workstreams', () => {
    useWorkstreamsMock.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    });
    renderPage();

    expect(
      screen.getByText('No workstreams yet. Create one to get started.'),
    ).toBeInTheDocument();
  });

  it('deletes a workstream after confirmation', async () => {
    useWorkstreamsMock.mockReturnValue({
      data: workstreams,
      isPending: false,
      isError: false,
    });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );

    expect(deleteWorkstreamMutate).toHaveBeenCalledWith(
      'workstream-1',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
