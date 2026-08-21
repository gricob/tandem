import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormsListPage } from '../../src/features/forms/forms-list-page';

const useFormsMock = vi.fn();

vi.mock('../../src/features/forms/queries', () => ({
  useForms: (name?: string) => useFormsMock(name),
  useCreateForm: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteForm: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../src/features/form-types/queries', () => ({
  useFormTypes: () => ({ data: [] }),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => <>{children}</>,
    useNavigate: () => vi.fn(),
  };
});

const forms = [
  {
    id: 'form-1',
    formTypeId: 'form-type-1',
    formTypeName: 'Bug report',
    name: 'Login bug',
    description: 'Info about the login bug',
    createdAt: '',
    updatedAt: '',
  },
];

function renderPage() {
  render(
    <MantineProvider>
      <FormsListPage />
    </MantineProvider>,
  );
}

describe('FormsListPage', () => {
  it('lists forms with their source form type', () => {
    useFormsMock.mockReturnValue({ data: forms, isPending: false, isError: false });
    renderPage();

    expect(screen.getByText('Login bug')).toBeInTheDocument();
    expect(screen.getByText('Bug report')).toBeInTheDocument();
  });

  it('passes the typed search term through to the forms query', async () => {
    useFormsMock.mockReturnValue({ data: forms, isPending: false, isError: false });
    renderPage();

    await userEvent.type(
      screen.getByPlaceholderText('Search forms by name'),
      'login',
    );

    expect(screen.getByPlaceholderText('Search forms by name')).toHaveValue(
      'login',
    );
  });

  it('shows an empty state when no forms match', () => {
    useFormsMock.mockReturnValue({ data: [], isPending: false, isError: false });
    renderPage();

    expect(screen.getByText('No forms found.')).toBeInTheDocument();
  });
});
