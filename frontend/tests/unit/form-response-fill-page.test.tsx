import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormResponseFillPage } from '../../src/features/form-responses/form-response-fill-page';

const useFormResponseMock = vi.fn();
const useSaveFormResponseMock = vi.fn();
const saveMutate = vi.fn();

vi.mock('../../src/features/form-responses/queries', () => ({
  useFormResponse: () => useFormResponseMock(),
  useSaveFormResponse: () => useSaveFormResponseMock(),
}));

vi.mock('../../src/features/forms/queries', () => ({
  useForm: () => ({
    data: {
      id: 'form-1',
      formTemplateId: 'form-template-1',
      formTemplateName: 'Bug report',
      name: 'Login bug',
      description: null,
      createdAt: '',
      updatedAt: '',
      fields: [
        {
          id: 'field-name',
          formId: 'form-1',
          label: 'Name',
          fieldType: 'text',
          isRequired: true,
          options: null,
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
          orderIndex: 1,
          createdAt: '',
          updatedAt: '',
        },
      ],
    },
    isPending: false,
    isError: false,
  }),
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

function renderPage() {
  render(
    <MantineProvider>
      <FormResponseFillPage />
    </MantineProvider>,
  );
}

describe('FormResponseFillPage', () => {
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
});
