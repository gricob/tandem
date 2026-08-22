import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormResponseViewPage } from '../../src/features/form-responses/form-response-view-page';

const useFormResponseMock = vi.fn();

vi.mock('../../src/features/form-responses/queries', () => ({
  useFormResponse: () => useFormResponseMock(),
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
          id: 'field-severity',
          formId: 'form-1',
          label: 'Severity',
          fieldType: 'select',
          isRequired: false,
          options: ['Low', 'High'],
          condition: null,
          orderIndex: 0,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'field-plan',
          formId: 'form-1',
          label: 'Plan details',
          fieldType: 'text',
          isRequired: true,
          options: null,
          condition: {
            field: 'field-severity',
            operator: 'equals',
            value: 'High',
          },
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
      <FormResponseViewPage />
    </MantineProvider>,
  );
}

describe('FormResponseViewPage', () => {
  it('shows an answered, currently visible field', () => {
    useFormResponseMock.mockReturnValue({
      data: {
        id: 'response-1',
        formId: 'form-1',
        responseData: { 'field-severity': 'High', 'field-plan': 'Escalate' },
        isComplete: true,
        createdAt: '',
        updatedAt: '',
      },
      isPending: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByText('Plan details')).toBeInTheDocument();
    expect(screen.getByText('Escalate')).toBeInTheDocument();
  });

  it("does not show a hidden field's stale value", () => {
    useFormResponseMock.mockReturnValue({
      data: {
        id: 'response-1',
        formId: 'form-1',
        // plan-details was answered while severity was 'High', but severity
        // has since changed to 'Low' - the field is hidden again, and its
        // stale answer should not be displayed.
        responseData: { 'field-severity': 'Low', 'field-plan': 'Escalate' },
        isComplete: true,
        createdAt: '',
        updatedAt: '',
      },
      isPending: false,
      isError: false,
    });

    renderPage();

    expect(screen.queryByText('Plan details')).not.toBeInTheDocument();
    expect(screen.queryByText('Escalate')).not.toBeInTheDocument();
  });
});
