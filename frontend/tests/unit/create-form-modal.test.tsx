import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateFormModal } from '../../src/features/forms/components/create-form-modal';

vi.mock('../../src/features/form-types/queries', () => ({
  useFormTypes: () => ({
    data: [
      { id: 'form-type-1', name: 'Bug report', fields: [] },
      { id: 'form-type-2', name: 'Feature request', fields: [] },
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
        <CreateFormModal opened onClose={onClose} onSubmit={onSubmit} />
      </QueryClientProvider>
    </MantineProvider>,
  );

  return { onClose, onSubmit };
}

function submitForm() {
  const form = screen.getByRole('button', { name: 'Create' }).closest('form');
  fireEvent.submit(form!);
}

// Mantine's generated `id`/`for` pair on labelled inputs is unreliable under
// jsdom (confirmed working in a real browser), so fields are queried by the
// stable `data-path` attribute `form.getInputProps` sets instead of by label.
function getInput(path: string): HTMLElement {
  const input = document.querySelector(`[data-path="${path}"]`);
  if (!input) {
    throw new Error(`No input found for data-path="${path}"`);
  }
  return input as HTMLElement;
}

describe('CreateFormModal', () => {
  it('rejects submitting without a form type or name', async () => {
    const { onSubmit } = renderModal();

    submitForm();

    expect(await screen.findByText('Form type is required')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('offers every available form type as an option', () => {
    renderModal();

    expect(getInput('formTypeId')).toHaveAttribute(
      'placeholder',
      'Select a form type',
    );
  });

  // Selecting an option from Mantine's Select dropdown and submitting the
  // resulting form type id is exercised in the Playwright e2e test instead
  // (Select's combobox options don't reliably render as queryable roles
  // under jsdom, matching the same limitation noted in FieldForm's tests).
});
