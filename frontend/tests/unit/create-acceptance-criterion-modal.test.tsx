import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateAcceptanceCriterionModal } from '../../src/features/deliverables/components/create-acceptance-criterion-modal';

vi.mock('../../src/features/form-templates/queries', () => ({
  useFormTemplates: () => ({
    data: [
      {
        id: 'form-template-2',
        name: 'Acceptance criterion',
        templateFields: [],
      },
    ],
  }),
}));

function renderModal() {
  const queryClient = new QueryClient();
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <CreateAcceptanceCriterionModal
          opened
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </QueryClientProvider>
    </MantineProvider>,
  );

  return { onClose, onSubmit };
}

function submitForm() {
  const form = screen.getByRole('button', { name: 'Create' }).closest('form');
  fireEvent.submit(form!);
}

function getInput(path: string): HTMLElement {
  const input = document.querySelector(`[data-path="${path}"]`);
  if (!input) {
    throw new Error(`No input found for data-path="${path}"`);
  }
  return input as HTMLElement;
}

describe('CreateAcceptanceCriterionModal', () => {
  it('shows the "New acceptance criterion" title with no name/description inputs', () => {
    renderModal();

    expect(screen.getByText('New acceptance criterion')).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Description' }),
    ).not.toBeInTheDocument();
  });

  it('rejects submitting without a form template', async () => {
    const { onSubmit } = renderModal();

    submitForm();

    expect(
      await screen.findByText('Form template is required'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('offers every available form template as an option', () => {
    renderModal();

    expect(getInput('formTemplateId')).toHaveAttribute(
      'placeholder',
      'Select a form template',
    );
  });
});
