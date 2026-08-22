import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InlineFields } from '../../src/features/deliverables/components/inline-fields';

const useFormResponseMock = vi.fn();
const useSaveFormResponseMock = vi.fn();
const saveMutate = vi.fn();

vi.mock('../../src/features/form-responses/queries', () => ({
  useFormResponse: () => useFormResponseMock(),
  useSaveFormResponse: () => useSaveFormResponseMock(),
}));

const fields = [
  {
    id: 'field-name',
    formId: 'story-1',
    label: 'Name',
    fieldType: 'text' as const,
    isRequired: true,
    options: null,
    orderIndex: 0,
    createdAt: '',
    updatedAt: '',
  },
];

function renderInlineFields() {
  render(
    <MantineProvider>
      <InlineFields formId="story-1" fields={fields} />
    </MantineProvider>,
  );
}

describe('InlineFields', () => {
  it('shows a message when the form template has no fields', () => {
    useFormResponseMock.mockReturnValue({ data: null, isPending: false });
    useSaveFormResponseMock.mockReturnValue({
      mutate: saveMutate,
      isPending: false,
      isSuccess: false,
    });

    render(
      <MantineProvider>
        <InlineFields formId="story-1" fields={[]} />
      </MantineProvider>,
    );

    expect(
      screen.getByText('This form template has no fields.'),
    ).toBeInTheDocument();
  });

  it('saves only the changed field on submit', async () => {
    useFormResponseMock.mockReturnValue({
      data: { responseData: {} },
      isPending: false,
    });
    useSaveFormResponseMock.mockReturnValue({
      mutate: saveMutate,
      isPending: false,
      isSuccess: false,
    });

    renderInlineFields();

    await userEvent.type(
      document.querySelector('[data-path="field-name"]')!,
      'Alice',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveMutate).toHaveBeenCalledWith({ 'field-name': 'Alice' });
  });
});
