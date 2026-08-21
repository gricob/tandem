import { expect, test } from '@playwright/test';

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  templateFields: unknown[];
}

interface Form {
  id: string;
  formTemplateId: string | null;
  formTemplateName: string | null;
  name: string;
  description: string | null;
  fields: unknown[];
}

let nextId = 1;
function id(): string {
  return `id-${nextId++}`;
}

test('creates a form template, creates a form from it, searches, edits, and deletes it', async ({
  page,
}) => {
  const formTemplates: FormTemplate[] = [];
  const forms: Form[] = [];

  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({ status: 200, json: { accessToken: 'e2e-session-token' } });
  });

  await page.route('**/api/v1/form-templates', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: formTemplates });
      return;
    }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as {
        name: string;
        description?: string;
      };
      const formTemplate: FormTemplate = {
        id: id(),
        name: body.name,
        description: body.description ?? null,
        templateFields: [],
      };
      formTemplates.push(formTemplate);
      await route.fulfill({ status: 201, json: formTemplate });
      return;
    }
    await route.continue();
  });

  await page.route(/\/api\/v1\/form-templates\/[^/]+$/, async (route) => {
    const formTemplateId = new URL(route.request().url()).pathname
      .split('/')
      .pop()!;
    const formTemplate = formTemplates.find((ft) => ft.id === formTemplateId);
    if (!formTemplate) {
      await route.fulfill({ status: 404, json: {} });
      return;
    }
    await route.fulfill({ status: 200, json: formTemplate });
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
        formTemplateId: string;
        name: string;
        description?: string;
      };
      const formTemplate = formTemplates.find(
        (ft) => ft.id === body.formTemplateId,
      )!;
      const form: Form = {
        id: id(),
        formTemplateId: body.formTemplateId,
        formTemplateName: formTemplate.name,
        name: body.name,
        description: body.description ?? null,
        fields: [],
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

  await page.getByRole('link', { name: 'Form templates' }).click();
  await expect(
    page.getByRole('heading', { name: 'Form templates' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'New form template' }).click();
  await page.getByLabel('Name').fill('Bug report');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(
    page.getByRole('heading', { name: 'Edit form template' }),
  ).toBeVisible();

  await page.goto('/forms');
  await expect(page.getByRole('heading', { name: 'Forms' })).toBeVisible();
  await expect(page.getByText('No forms found.')).toBeVisible();

  await page.getByRole('button', { name: 'New form' }).click();
  await page.getByRole('textbox', { name: 'Form template' }).click();
  await page.getByRole('option', { name: 'Bug report' }).click();
  await page.getByLabel('Name').fill('Login bug');
  await page.getByLabel('Description').fill('Info about the login bug');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('heading', { name: 'Edit form' })).toBeVisible();
  await expect(page.getByLabel('Form template')).toHaveValue('Bug report');

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
