import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDeleteModal } from '../../src/features/forms/components/confirm-delete-modal';

function renderModal(overrides: Partial<Parameters<typeof ConfirmDeleteModal>[0]> = {}) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();

  render(
    <MantineProvider>
      <ConfirmDeleteModal
        opened
        title="Delete form"
        description='Delete "Login bug"?'
        onCancel={onCancel}
        onConfirm={onConfirm}
        {...overrides}
      />
    </MantineProvider>,
  );

  return { onCancel, onConfirm };
}

describe('ConfirmDeleteModal (forms)', () => {
  it('shows the title and description', () => {
    renderModal();

    expect(screen.getByText('Delete form')).toBeInTheDocument();
    expect(screen.getByText('Delete "Login bug"?')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const { onCancel, onConfirm } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when Delete is clicked', async () => {
    const { onCancel, onConfirm } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
