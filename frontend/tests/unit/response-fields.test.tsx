import { MantineProvider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ResponseFields } from '../../src/features/form-responses/components/response-fields';
import type { FormField } from '../../src/features/forms/api';
import type { ResponseValues } from '../../src/features/form-responses/value-utils';

function getInput(path: string): HTMLElement {
  const input = document.querySelector(`[data-path="${path}"]`);
  if (!input) {
    throw new Error(`No input found for data-path="${path}"`);
  }
  return input as HTMLElement;
}

function makeField(overrides: Partial<FormField>): FormField {
  return {
    id: 'field-1',
    formId: 'form-1',
    label: 'Field',
    fieldType: 'text',
    isRequired: false,
    options: null,
    orderIndex: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  } as FormField;
}

function TestHarness({ fields }: { fields: FormField[] }) {
  const form = useForm<ResponseValues>({
    initialValues: Object.fromEntries(
      fields.map((field) => [
        field.id,
        field.fieldType === 'multi_select'
          ? []
          : field.fieldType === 'boolean'
            ? false
            : '',
      ]),
    ),
  });
  return <ResponseFields fields={fields} form={form} />;
}

function renderFields(fields: FormField[]) {
  render(
    <MantineProvider>
      <TestHarness fields={fields} />
    </MantineProvider>,
  );
}

describe('ResponseFields', () => {
  it('renders a text input for a text field', () => {
    renderFields([makeField({ id: 'name', fieldType: 'text', label: 'Name' })]);

    expect(getInput('name')).toBeInTheDocument();
  });

  it('marks a required field label with an asterisk', () => {
    renderFields([
      makeField({ id: 'name', fieldType: 'text', label: 'Name', isRequired: true }),
    ]);

    expect(screen.getByText('Name *')).toBeInTheDocument();
  });

  it('renders a number input for a number field', async () => {
    renderFields([makeField({ id: 'age', fieldType: 'number', label: 'Age' })]);

    await userEvent.type(getInput('age'), '42');

    expect(getInput('age')).toHaveValue('42');
  });

  it('renders a switch for a boolean field', () => {
    renderFields([
      makeField({ id: 'agreed', fieldType: 'boolean', label: 'Agreed' }),
    ]);

    expect(screen.getByLabelText('Agreed')).toHaveAttribute('type', 'checkbox');
  });

  it('renders a select with its options for a select field', () => {
    renderFields([
      makeField({
        id: 'severity',
        fieldType: 'select',
        label: 'Severity',
        options: ['Low', 'High'],
      }),
    ]);

    expect(getInput('severity')).toBeInTheDocument();
  });

  it('renders a multi-select for a multi_select field', () => {
    renderFields([
      makeField({
        id: 'tags',
        fieldType: 'multi_select',
        label: 'Tags',
        options: ['Bug', 'Feature'],
      }),
    ]);

    expect(getInput('tags')).toBeInTheDocument();
  });

  it('renders a date input for a date field', () => {
    renderFields([makeField({ id: 'due', fieldType: 'date', label: 'Due' })]);

    expect(getInput('due')).toHaveAttribute('type', 'date');
  });
});
