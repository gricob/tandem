import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AcceptanceCriteriaList } from '../../src/features/deliverables/components/acceptance-criteria-list';
import type { AcceptanceCriterion } from '../../src/features/deliverables/api';

const removeAcceptanceCriterionMutate = vi.fn();
const reorderAcceptanceCriteriaMutate = vi.fn();

vi.mock('../../src/features/deliverables/queries', () => ({
  useRemoveAcceptanceCriterion: () => ({
    mutate: removeAcceptanceCriterionMutate,
  }),
  useReorderAcceptanceCriteria: () => ({
    mutate: reorderAcceptanceCriteriaMutate,
  }),
}));

vi.mock('../../src/features/deliverables/components/inline-fields', () => ({
  InlineFields: () => null,
}));

const acceptanceCriterion: AcceptanceCriterion = {
  id: 'criterion-1',
  formTemplateId: 'form-template-2',
  formTemplateName: 'Acceptance criterion',
  createdAt: '',
  updatedAt: '',
  fields: [],
  userStoryId: 'story-1',
  orderIndex: 0,
};

function renderList(acceptanceCriteria: AcceptanceCriterion[]) {
  render(
    <MantineProvider>
      <AcceptanceCriteriaList
        deliverableId="deliverable-1"
        userStoryId="story-1"
        acceptanceCriteria={acceptanceCriteria}
      />
    </MantineProvider>,
  );
}

describe('AcceptanceCriteriaList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a message when there are no acceptance criteria', () => {
    renderList([]);

    expect(screen.getByText('No acceptance criteria yet.')).toBeInTheDocument();
  });

  it('renders an acceptance criterion by its source template name', () => {
    renderList([acceptanceCriterion]);

    expect(screen.getByText('Acceptance criterion')).toBeInTheDocument();
  });

  it('removes an acceptance criterion when its remove button is clicked', async () => {
    renderList([acceptanceCriterion]);

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Acceptance criterion' }),
    );

    expect(removeAcceptanceCriterionMutate).toHaveBeenCalledWith('criterion-1');
  });
});
