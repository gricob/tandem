import { MantineProvider } from '@mantine/core';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkPage } from '../../src/features/work/work-page';

const workstreamA = {
  id: 'ws-a',
  name: 'Alpha',
  description: 'First workstream',
  deliverables: [
    {
      id: 'del-a1',
      workstreamId: 'ws-a',
      orderIndex: 0,
      name: 'Deliverable A1',
      description: '',
      createdAt: '',
      updatedAt: '',
      userStories: [],
    },
  ],
};

const workstreamB = {
  id: 'ws-b',
  name: 'Beta',
  description: '',
  deliverables: [],
};

const deliverableA1 = {
  id: 'del-a1',
  workstreamId: 'ws-a',
  orderIndex: 0,
  name: 'Deliverable A1',
  description: '',
  createdAt: '',
  updatedAt: '',
  userStories: [],
};

const workstreams = [workstreamA, workstreamB];
const workstreamsById: Record<string, typeof workstreamA | typeof workstreamB> = {
  'ws-a': workstreamA,
  'ws-b': workstreamB,
};

const noopMutation = { mutate: vi.fn(), isPending: false };

vi.mock('../../src/features/workstreams/queries', () => ({
  useWorkstreams: () => ({ data: workstreams, isPending: false, isError: false }),
  useWorkstream: (id: string) => ({
    data: workstreamsById[id],
    isPending: false,
  }),
  useCreateWorkstream: () => noopMutation,
  useUpdateWorkstream: () => noopMutation,
  useAddDeliverable: () => noopMutation,
  useReorderDeliverables: () => noopMutation,
}));

vi.mock('../../src/features/deliverables/queries', () => ({
  useDeliverable: (id: string) => ({
    data: id === 'del-a1' ? deliverableA1 : undefined,
    isPending: false,
    isError: false,
  }),
  useUpdateDeliverable: () => noopMutation,
  useAddUserStory: () => noopMutation,
  useReorderUserStories: () => noopMutation,
  useAddAcceptanceCriterion: () => noopMutation,
  useRemoveAcceptanceCriterion: () => noopMutation,
  useReorderAcceptanceCriteria: () => noopMutation,
  useUpdateUserStoryDetails: () => noopMutation,
}));

vi.mock('../../src/features/form-templates/queries', () => ({
  useFormTemplates: () => ({ data: [] }),
}));

function renderWorkPageAt(pathname: string) {
  const rootRoute = createRootRoute();
  const workRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/work',
    validateSearch: (search: Record<string, unknown>) => ({
      ws: typeof search.ws === 'string' ? search.ws : undefined,
      del: typeof search.del === 'string' ? search.del : undefined,
    }),
    component: WorkPage,
  });
  const routeTree = rootRoute.addChildren([workRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });

  return render(
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>,
  );
}

describe('WorkPage', () => {
  it('defaults to the first workstream and shows its deliverables', async () => {
    renderWorkPageAt('/work');

    expect(await screen.findByText('Deliverable A1')).toBeInTheDocument();
    // No deliverable selected yet: shows the workstream's own detail form.
    expect(
      screen.getByRole('heading', { name: 'Workstream details' }),
    ).toBeInTheDocument();
  });

  it('selecting a workstream updates the deliverables panel', async () => {
    renderWorkPageAt('/work');

    await userEvent.click(await screen.findByText('Beta'));

    expect(await screen.findByText('No deliverables yet. Add one above.')).toBeInTheDocument();
  });

  it('selecting a deliverable shows its detail panel', async () => {
    renderWorkPageAt('/work?ws=ws-a');

    await userEvent.click(await screen.findByText('Deliverable A1'));

    expect(
      await screen.findByRole('heading', { name: 'User stories' }),
    ).toBeInTheDocument();
  });

  it('deep-links to a pre-selected workstream and deliverable', async () => {
    renderWorkPageAt('/work?ws=ws-a&del=del-a1');

    expect(
      await screen.findByRole('heading', { name: 'User stories' }),
    ).toBeInTheDocument();
  });
});
