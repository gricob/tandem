import { expect, test } from '@playwright/test';

interface FormType {
  id: string;
  name: string;
  description: string | null;
  fields: unknown[];
}

interface Form {
  id: string;
  formTypeId: string;
  formTypeName: string;
  name: string;
  description: string | null;
}

let nextId = 1;
function id(): string {
  return `id-${nextId++}`;
}

test('creates a form type, creates a form from it, searches, edits, and deletes it', async ({
  page,
}) => {
  const formTypes: FormType[] = [];
  const forms: Form[] = [];

  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({ status: 200, json: { accessToken: 'e2e-session-token' } });
  });

  await page.route('**/api/v1/form-types', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: formTypes });
      return;
    }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as {
        name: string;
        description?: string;
      };
      const formType: FormType = {
        id: id(),
        name: body.name,
        description: body.description ?? null,
        fields: [],
      };
      formTypes.push(formType);
      await route.fulfill({ status: 201, json: formType });
      return;
    }
    await route.continue();
  });

  await page.route(/\/api\/v1\/form-types\/[^/]+$/, async (route) => {
    const formTypeId = new URL(route.request().url()).pathname.split('/').pop()!;
    const formType = formTypes.find((ft) => ft.id === formTypeId);
    if (!formType) {
      await route.fulfill({ status: 404, json: {} });
      return;
    }
    await route.fulfill({ status: 200, json: formType });
  });

  await page.route('**/api/v1/forms**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname !== '/api/v1/forms') {
      await route.continue();
      return;
    }
    if (route.request().method() === 'GET') {
      const nameFilter = url.searchParams.get('name')?.toLowerCase();
      const filtered = nameFilter
        ? forms.filter((form) => form.name.toLowerCase().includes(nameFilter))
        : forms;
      await route.fulfill({ status: 200, json: filtered });
      return;
    }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as {
        formTypeId: string;
        name: string;
        description?: string;
      };
      const formType = formTypes.find((ft) => ft.id === body.formTypeId)!;
      const form: Form = {
        id: id(),
        formTypeId: body.formTypeId,
        formTypeName: formType.name,
        name: body.name,
        description: body.description ?? null,
      };
      forms.push(form);
      await route.fulfill({ status: 201, json: form });
      return;
    }
    await route.continue();
  });

  await page.route(/\/api\/v1\/forms\/[^/?]+$/, async (route) => {
    const formId = new URL(route.request().url()).pathname.split('/').pop()!;
    const form = forms.find((f) => f.id === formId);
    if (!form) {
      await route.fulfill({ status: 404, json: {} });
      return;
    }

    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: form });
      return;
    }
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as {
        name?: string;
        description?: string;
      };
      Object.assign(form, body);
      await route.fulfill({ status: 200, json: form });
      return;
    }
    if (route.request().method() === 'DELETE') {
      forms.splice(forms.indexOf(form), 1);
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  await page.getByLabel(/password/i).fill('correct-password');
  await page.getByRole('button', { name: 'Enter' }).click();

  await page.getByRole('link', { name: 'Form types' }).click();
  await expect(page.getByRole('heading', { name: 'Form types' })).toBeVisible();

  await page.getByRole('button', { name: 'New form type' }).click();
  await page.getByLabel('Name').fill('Bug report');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name: 'Edit form type' })).toBeVisible();

  await page.goto('/forms');
  await expect(page.getByRole('heading', { name: 'Forms' })).toBeVisible();
  await expect(page.getByText('No forms found.')).toBeVisible();

  await page.getByRole('button', { name: 'New form' }).click();
  await page.getByRole('textbox', { name: 'Form type' }).click();
  await page.getByRole('option', { name: 'Bug report' }).click();
  await page.getByLabel('Name').fill('Login bug');
  await page.getByLabel('Description').fill('Info about the login bug');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('heading', { name: 'Edit form' })).toBeVisible();
  await expect(page.getByLabel('Form type')).toHaveValue('Bug report');

  await page.getByRole('link', { name: '← Forms' }).click();
  await expect(page.getByRole('link', { name: 'Login bug' })).toBeVisible();
  await expect(page.getByText('Bug report')).toBeVisible();

  await page.getByPlaceholder('Search forms by name').fill('nonexistent');
  await expect(page.getByText('No forms found.')).toBeVisible();

  await page.getByPlaceholder('Search forms by name').fill('login');
  await expect(page.getByRole('link', { name: 'Login bug' })).toBeVisible();

  await page.getByRole('link', { name: 'Login bug' }).click();
  await expect(page.getByRole('heading', { name: 'Edit form' })).toBeVisible();
  await page.getByLabel('Name').fill('Login bug (updated)');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('link', { name: '← Forms' }).click();
  await expect(page.getByText('Login bug (updated)')).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No forms found.')).toBeVisible();
});
