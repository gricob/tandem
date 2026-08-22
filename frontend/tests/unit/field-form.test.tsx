import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FieldForm } from '../../src/features/form-templates/components/field-form';
import type { AvailableConditionField } from '../../src/features/form-templates/components/condition-builder';
import type { FieldFormValues } from '../../src/features/form-templates/schemas';

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

function renderForm(
  initialValues?: FieldFormValues,
  availableFields: AvailableConditionField[] = [],
) {
  const onSubmit = vi.fn();

  render(
    <MantineProvider>
      <FieldForm
        initialValues={initialValues}
        availableFields={availableFields}
        submitLabel="Save"
        onSubmit={onSubmit}
      />
    </MantineProvider>,
  );

  return { onSubmit };
}

const selectFieldValues: FieldFormValues = {
  label: 'Severity',
  fieldType: 'select',
  isRequired: false,
  options: [],
  condition: null,
};

const triggerField: AvailableConditionField = {
  id: 'field-trigger',
  label: 'Has manager',
  fieldType: 'boolean',
  options: null,
};

describe('FieldForm', () => {
  it('does not show an options input for a text field', () => {
    renderForm();

    expect(document.querySelector('[data-path="options"]')).not.toBeInTheDocument();
  });

  it('shows an options input for a select field', () => {
    renderForm(selectFieldValues);

    expect(getInput('options')).toBeInTheDocument();
  });

  it('rejects submitting a select field with no options', async () => {
    const { onSubmit } = renderForm(selectFieldValues);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Add at least one option')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a select field with its options', async () => {
    const { onSubmit } = renderForm(selectFieldValues);

    await userEvent.type(getInput('options'), 'Low{Enter}High{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      label: 'Severity',
      fieldType: 'select',
      isRequired: false,
      options: ['Low', 'High'],
      condition: null,
    });
  });

  it('submits a text field without requiring options', async () => {
    const { onSubmit } = renderForm();

    await userEvent.type(getInput('label'), 'Notes');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      label: 'Notes',
      fieldType: 'text',
      isRequired: false,
      options: [],
      condition: null,
    });
  });

  it('disables the condition toggle when there are no other fields to depend on', () => {
    renderForm();

    expect(
      screen.getByLabelText('Only show this field when a condition is met'),
    ).toBeDisabled();
  });

  it('enables building a condition once other fields are available', async () => {
    renderForm(undefined, [triggerField]);

    await userEvent.click(
      screen.getByLabelText('Only show this field when a condition is met'),
    );

    expect(screen.getByLabelText('Condition field')).toBeInTheDocument();
    expect(screen.getByLabelText('Condition operator')).toBeInTheDocument();
  });

  it('submits the built condition alongside the field', async () => {
    const { onSubmit } = renderForm(undefined, [triggerField]);

    await userEvent.type(getInput('label'), 'Manager name');
    await userEvent.click(
      screen.getByLabelText('Only show this field when a condition is met'),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      label: 'Manager name',
      condition: {
        op: 'AND',
        clauses: [{ field: 'field-trigger', operator: 'equals', value: true }],
      },
    });
  });
});
