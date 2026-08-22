import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserStoryList } from '../../src/features/deliverables/components/user-story-list';
import type { UserStory } from '../../src/features/deliverables/api';

const addAcceptanceCriterionMutate = vi.fn(
  (_values: unknown, options?: { onSuccess?: () => void }) => {
    options?.onSuccess?.();
  },
);
const removeUserStoryMutate = vi.fn();
const reorderUserStoriesMutate = vi.fn();
const updateUserStoryDetailsMutate = vi.fn();

vi.mock('../../src/features/deliverables/queries', () => ({
  useAddAcceptanceCriterion: () => ({
    mutate: addAcceptanceCriterionMutate,
    isPending: false,
  }),
  useRemoveUserStory: () => ({ mutate: removeUserStoryMutate }),
  useReorderUserStories: () => ({ mutate: reorderUserStoriesMutate }),
  useUpdateUserStoryDetails: () => ({
    mutate: updateUserStoryDetailsMutate,
    isPending: false,
  }),
}));

vi.mock('../../src/features/deliverables/components/inline-fields', () => ({
  InlineFields: () => null,
}));

vi.mock(
  '../../src/features/deliverables/components/acceptance-criteria-list',
  () => ({
    AcceptanceCriteriaList: () => null,
  }),
);

vi.mock('../../src/features/form-templates/queries', () => ({
  useFormTemplates: () => ({
    data: [
      {
        id: 'form-template-1',
        name: 'Acceptance criterion',
        templateFields: [],
      },
    ],
  }),
}));

const userStory: UserStory = {
  id: 'story-1',
  formTemplateId: 'form-template-1',
  formTemplateName: 'User story',
  name: 'Sign up',
  description: 'As a visitor, I want to sign up',
  createdAt: '',
  updatedAt: '',
  fields: [],
  deliverableId: 'deliverable-1',
  orderIndex: 0,
  acceptanceCriteria: [],
};

function renderList(userStories: UserStory[]) {
  render(
    <MantineProvider>
      <UserStoryList deliverableId="deliverable-1" userStories={userStories} />
    </MantineProvider>,
  );
}

describe('UserStoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a message when there are no user stories', () => {
    renderList([]);

    expect(
      screen.getByText('No user stories yet. Add one above.'),
    ).toBeInTheDocument();
  });

  it('renders a user story in read mode, with its name, description, and template', () => {
    renderList([userStory]);

    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(
      screen.getByText('As a visitor, I want to sign up'),
    ).toBeInTheDocument();
    expect(screen.getByText('Template: User story')).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
  });

  it("switches to edit mode and edits a user story's name and description", async () => {
    renderList([userStory]);

    await userEvent.click(screen.getByRole('button', { name: 'Edit Sign up' }));

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Sign up quickly');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateUserStoryDetailsMutate).toHaveBeenCalledWith(
      {
        name: 'Sign up quickly',
        description: 'As a visitor, I want to sign up',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('returns to read mode without saving when edit is cancelled', async () => {
    renderList([userStory]);

    await userEvent.click(screen.getByRole('button', { name: 'Edit Sign up' }));
    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Something else');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(updateUserStoryDetailsMutate).not.toHaveBeenCalled();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
  });

  it('removes a user story when its remove button is clicked', async () => {
    renderList([userStory]);

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Sign up' }),
    );

    expect(removeUserStoryMutate).toHaveBeenCalledWith('story-1');
  });

  it('opens the "New acceptance criterion" modal from the "+ Acceptance criterion" button', async () => {
    renderList([userStory]);

    expect(
      screen.queryByText('New acceptance criterion'),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: '+ Acceptance criterion' }),
    );

    expect(
      await screen.findByText('New acceptance criterion'),
    ).toBeInTheDocument();
  });
});
