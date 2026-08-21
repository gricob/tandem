import { expect, test } from '@playwright/test';

interface FormField {
  id: string;
  formTypeId: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  options: string[] | null;
  orderIndex: number;
}

interface FormType {
  id: string;
  name: string;
  description: string | null;
  fields: FormField[];
}

interface Form {
  id: string;
  formTypeId: string;
  formTypeName: string;
  name: string;
  description: string | null;
}

interface FormResponse {
  id: string;
  formId: string;
  responseData: Record<string, unknown>;
  isComplete: boolean;
}

let nextId = 1;
function id(): string {
  return `id-${nextId++}`;
}

test('fills in a form, views the response, and edits it', async ({
  page,
}) => {
  const formTypes: FormType[] = [];
  const forms: Form[] = [];
  const responses = new Map<string, FormResponse>();

  function isComplete(formId: string): boolean {
    const form = forms.find((f) => f.id === formId)!;
    const formType = formTypes.find((ft) => ft.id === form.formTypeId)!;
    const responseData = responses.get(formId)?.responseData ?? {};
    return formType.fields
      .filter((field) => field.isRequired)
      .every((field) => responseData[field.id] != null);
  }

  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      json: { accessToken: 'e2e-session-token' },
    });
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

  await page.route(/\/api\/v1\/form-types\/[^/]+\/fields$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const formTypeId = new URL(route.request().url()).pathname
      .split('/')
      .at(-2)!;
    const formType = formTypes.find((ft) => ft.id === formTypeId)!;
    const body = route.request().postDataJSON() as {
      label: string;
      fieldType: string;
      isRequired?: boolean;
      options?: string[];
    };
    const field: FormField = {
      id: id(),
      formTypeId,
      label: body.label,
      fieldType: body.fieldType,
      isRequired: body.isRequired ?? false,
      options: body.options ?? null,
      orderIndex: formType.fields.length,
    };
    formType.fields.push(field);
    await route.fulfill({ status: 201, json: field });
  });

  await page.route(/\/api\/v1\/form-types\/[^/]+$/, async (route) => {
    const formTypeId = new URL(route.request().url()).pathname
      .split('/')
      .pop()!;
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
      await route.fulfill({ status: 200, json: forms });
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

  await page.route(/\/api\/v1\/forms\/[^/]+\/response$/, async (route) => {
    const formId = new URL(route.request().url()).pathname
      .split('/')
      .at(-2)!;

    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() as {
        responseData: Record<string, unknown>;
      };
      const existing = responses.get(formId);
      const merged = { ...(existing?.responseData ?? {}) };
      for (const [fieldId, value] of Object.entries(body.responseData)) {
        if (value === null) {
          delete merged[fieldId];
        } else {
          merged[fieldId] = value;
        }
      }
      const saved: FormResponse = {
        id: existing?.id ?? id(),
        formId,
        responseData: merged,
        isComplete: false,
      };
      responses.set(formId, saved);
      saved.isComplete = isComplete(formId);
      await route.fulfill({ status: 200, json: saved });
      return;
    }

    if (route.request().method() === 'GET') {
      const response = responses.get(formId);
      if (!response) {
        await route.fulfill({ status: 404, json: {} });
        return;
      }
      await route.fulfill({ status: 200, json: response });
      return;
    }

    await route.continue();
  });

  await page.route(/\/api\/v1\/forms\/[^/]+$/, async (route) => {
    const formId = new URL(route.request().url()).pathname.split('/').pop()!;
    const form = forms.find((f) => f.id === formId);
    if (!form) {
      await route.fulfill({ status: 404, json: {} });
      return;
    }
    await route.fulfill({ status: 200, json: form });
  });

  await page.goto('/');
  await page.getByLabel(/password/i).fill('correct-password');
  await page.getByRole('button', { name: 'Enter' }).click();

  await page.getByRole('link', { name: 'Form types' }).click();
  await page.getByRole('button', { name: 'New form type' }).click();
  await page.getByLabel('Name').fill('Bug report');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(
    page.getByRole('heading', { name: 'Edit form type' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add field' }).click();
  await page.getByRole('textbox', { name: 'Label' }).fill('Reporter');
  await page.getByLabel('Required').click();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('Reporter')).toBeVisible();

  await page.getByRole('button', { name: 'Add field' }).click();
  await page.getByRole('textbox', { name: 'Label' }).fill('Notes');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('Notes')).toBeVisible();

  await page.goto('/forms');
  await page.getByRole('button', { name: 'New form' }).click();
  await page.getByRole('textbox', { name: 'Form type' }).click();
  await page.getByRole('option', { name: 'Bug report' }).click();
  await page.getByLabel('Name').fill('Login bug');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name: 'Edit form' })).toBeVisible();

  await page.getByRole('link', { name: 'View response' }).click();
  await expect(
    page.getByText('No response has been saved for this form yet.'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Fill in form' }).click();
  const missingFieldsAlert = page.getByText('Missing required fields');
  await expect(missingFieldsAlert).toBeVisible();
  await expect(page.getByText('Reporter', { exact: true })).toBeVisible();

  const notesFieldId = formTypes[0]!.fields.find(
    (f) => f.label === 'Notes',
  )!.id;
  await page.locator(`[data-path="${notesFieldId}"]`).fill('First report');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved')).toBeVisible();

  await page.getByRole('link', { name: /Login bug/ }).click();
  await page.getByRole('link', { name: 'View response' }).click();
  await expect(page.getByText('Incomplete')).toBeVisible();
  await expect(page.getByText('First report')).toBeVisible();

  await page.getByRole('link', { name: 'Edit response' }).click();
  const reporterFieldId = formTypes[0]!.fields.find(
    (f) => f.label === 'Reporter',
  )!.id;
  await page.locator(`[data-path="${reporterFieldId}"]`).fill('Alice');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved')).toBeVisible();

  await page.getByRole('link', { name: /Login bug/ }).click();
  await page.getByRole('link', { name: 'View response' }).click();
  await expect(page.getByText('Complete')).toBeVisible();
  await expect(page.getByText('Alice')).toBeVisible();
});
