import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateDeliverableModal } from '../../src/features/deliverables/components/create-deliverable-modal';

function renderModal() {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  render(
    <MantineProvider>
      <CreateDeliverableModal opened onClose={onClose} onSubmit={onSubmit} />
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

describe('CreateDeliverableModal', () => {
  it('rejects submitting with an empty name', async () => {
    const { onSubmit } = renderModal();

    submitForm();

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the entered name and description', async () => {
    const { onSubmit } = renderModal();

    await userEvent.type(getInput('name'), 'Reporting dashboard');
    await userEvent.type(getInput('description'), 'Internal metrics');
    submitForm();

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      name: 'Reporting dashboard',
      description: 'Internal metrics',
    });
  });
});
