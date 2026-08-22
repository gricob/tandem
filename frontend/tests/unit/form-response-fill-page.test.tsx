import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FormResponseFillPage } from '../../src/features/form-responses/form-response-fill-page';

const useFormResponseMock = vi.fn();
const useSaveFormResponseMock = vi.fn();
const useFormMock = vi.fn();
const saveMutate = vi.fn();

vi.mock('../../src/features/form-responses/queries', () => ({
  useFormResponse: () => useFormResponseMock(),
  useSaveFormResponse: () => useSaveFormResponseMock(),
}));

vi.mock('../../src/features/forms/queries', () => ({
  useForm: () => useFormMock(),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => <>{children}</>,
    useParams: () => ({ formId: 'form-1' }),
  };
});

const baseFields = [
  {
    id: 'field-name',
    formId: 'form-1',
    label: 'Name',
    fieldType: 'text',
    isRequired: true,
    options: null,
    condition: null,
    orderIndex: 0,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'field-severity',
    formId: 'form-1',
    label: 'Severity',
    fieldType: 'select',
    isRequired: false,
    options: ['Low', 'High'],
    condition: null,
    orderIndex: 1,
    createdAt: '',
    updatedAt: '',
  },
];

const conditionalField = {
  id: 'field-plan',
  formId: 'form-1',
  label: 'Plan details',
  fieldType: 'text',
  isRequired: true,
  options: null,
  condition: { field: 'field-severity', operator: 'equals', value: 'High' },
  orderIndex: 2,
  createdAt: '',
  updatedAt: '',
};

function mockForm(fields: unknown[]) {
  useFormMock.mockReturnValue({
    data: {
      id: 'form-1',
      formTemplateId: 'form-template-1',
      formTemplateName: 'Bug report',
      name: 'Login bug',
      description: null,
      createdAt: '',
      updatedAt: '',
      fields,
    },
    isPending: false,
    isError: false,
  });
}

function renderPage() {
  render(
    <MantineProvider>
      <FormResponseFillPage />
    </MantineProvider>,
  );
}

describe('FormResponseFillPage', () => {
  beforeEach(() => {
    mockForm(baseFields);
  });

  it('flags a missing required field when no response has been saved yet', () => {
    useFormResponseMock.mockReturnValue({
      data: null,
      isPending: false,
      isError: false,
    });
    useSaveFormResponseMock.mockReturnValue({
      mutate: saveMutate,
      isPending: false,
      isSuccess: false,
    });

    renderPage();

    expect(screen.getByText('Missing required fields')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('does not flag a required field that already has a saved value', () => {
    useFormResponseMock.mockReturnValue({
      data: {
        id: 'response-1',
        formId: 'form-1',
        responseData: { 'field-name': 'Alice' },
        isComplete: true,
        createdAt: '',
        updatedAt: '',
      },
      isPending: false,
      isError: false,
    });
    useSaveFormResponseMock.mockReturnValue({
      mutate: saveMutate,
      isPending: false,
      isSuccess: false,
    });

    renderPage();

    expect(
      screen.queryByText('Missing required fields'),
    ).not.toBeInTheDocument();
  });

  it('saves only the changed field on submit', async () => {
    useFormResponseMock.mockReturnValue({
      data: {
        id: 'response-1',
        formId: 'form-1',
        responseData: { 'field-severity': 'Low' },
        isComplete: false,
        createdAt: '',
        updatedAt: '',
      },
      isPending: false,
      isError: false,
    });
    useSaveFormResponseMock.mockReturnValue({
      mutate: saveMutate,
      isPending: false,
      isSuccess: false,
    });

    renderPage();

    await userEvent.type(
      document.querySelector('[data-path="field-name"]')!,
      'Alice',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveMutate).toHaveBeenCalledWith({ 'field-name': 'Alice' });
  });

  describe('conditional fields', () => {
    beforeEach(() => {
      mockForm([...baseFields, conditionalField]);
    });

    it('hides a field whose condition is not currently met', () => {
      useFormResponseMock.mockReturnValue({
        data: {
          id: 'response-1',
          formId: 'form-1',
          responseData: { 'field-name': 'Alice', 'field-severity': 'Low' },
          isComplete: true,
          createdAt: '',
          updatedAt: '',
        },
        isPending: false,
        isError: false,
      });
      useSaveFormResponseMock.mockReturnValue({
        mutate: saveMutate,
        isPending: false,
        isSuccess: false,
      });

      renderPage();

      expect(
        document.querySelector('[data-path="field-plan"]'),
      ).not.toBeInTheDocument();
    });

    // Live interaction with Mantine's Select dropdown (choosing a trigger
    // value to flip visibility) isn't reliably testable under jsdom - see
    // the same limitation noted in FieldForm's and CreateFormModal's tests.
    // Covered instead by the fields' own condition-evaluator unit tests
    // (tests/unit/condition.test.ts) plus manual/e2e verification.

    it('does not flag a hidden required field as missing', () => {
      useFormResponseMock.mockReturnValue({
        data: {
          id: 'response-1',
          formId: 'form-1',
          responseData: { 'field-name': 'Alice', 'field-severity': 'Low' },
          isComplete: true,
          createdAt: '',
          updatedAt: '',
        },
        isPending: false,
        isError: false,
      });
      useSaveFormResponseMock.mockReturnValue({
        mutate: saveMutate,
        isPending: false,
        isSuccess: false,
      });

      renderPage();

      expect(
        screen.queryByText('Missing required fields'),
      ).not.toBeInTheDocument();
    });

    it('flags a visible required field left unanswered', () => {
      useFormResponseMock.mockReturnValue({
        data: {
          id: 'response-1',
          formId: 'form-1',
          responseData: { 'field-name': 'Alice', 'field-severity': 'High' },
          isComplete: false,
          createdAt: '',
          updatedAt: '',
        },
        isPending: false,
        isError: false,
      });
      useSaveFormResponseMock.mockReturnValue({
        mutate: saveMutate,
        isPending: false,
        isSuccess: false,
      });

      renderPage();

      expect(screen.getByText('Missing required fields')).toBeInTheDocument();
      expect(screen.getByText('Plan details')).toBeInTheDocument();
    });
  });
});
