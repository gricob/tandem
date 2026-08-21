import { expect, test } from '@playwright/test';

interface FormTemplateField {
  id: string;
  formTemplateId: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  options: string[] | null;
  orderIndex: number;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  templateFields: FormTemplateField[];
}

interface FormField {
  id: string;
  formId: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  options: string[] | null;
  orderIndex: number;
}

interface Form {
  id: string;
  formTemplateId: string | null;
  formTemplateName: string | null;
  name: string;
  description: string | null;
  fields: FormField[];
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
  const formTemplates: FormTemplate[] = [];
  const forms: Form[] = [];
  const responses = new Map<string, FormResponse>();

  function isComplete(formId: string): boolean {
    const form = forms.find((f) => f.id === formId)!;
    const responseData = responses.get(formId)?.responseData ?? {};
    return form.fields
      .filter((field) => field.isRequired)
      .every((field) => responseData[field.id] != null);
  }

  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      json: { accessToken: 'e2e-session-token' },
    });
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

  await page.route(
    /\/api\/v1\/form-templates\/[^/]+\/fields$/,
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      const formTemplateId = new URL(route.request().url()).pathname
        .split('/')
        .at(-2)!;
      const formTemplate = formTemplates.find(
        (ft) => ft.id === formTemplateId,
      )!;
      const body = route.request().postDataJSON() as {
        label: string;
        fieldType: string;
        isRequired?: boolean;
        options?: string[];
      };
      const field: FormTemplateField = {
        id: id(),
        formTemplateId,
        label: body.label,
        fieldType: body.fieldType,
        isRequired: body.isRequired ?? false,
        options: body.options ?? null,
        orderIndex: formTemplate.templateFields.length,
      };
      formTemplate.templateFields.push(field);
      await route.fulfill({ status: 201, json: field });
    },
  );

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
      await route.fulfill({ status: 200, json: forms });
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
      const formId = id();
      const clonedFields: FormField[] = formTemplate.templateFields.map(
        (templateField) => ({
          id: id(),
          formId,
          label: templateField.label,
          fieldType: templateField.fieldType,
          isRequired: templateField.isRequired,
          options: templateField.options,
          orderIndex: templateField.orderIndex,
        }),
      );
      const form: Form = {
        id: formId,
        formTemplateId: body.formTemplateId,
        formTemplateName: formTemplate.name,
        name: body.name,
        description: body.description ?? null,
        fields: clonedFields,
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

  await page.getByRole('link', { name: 'Form templates' }).click();
  await page.getByRole('button', { name: 'New form template' }).click();
  await page.getByLabel('Name').fill('Bug report');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(
    page.getByRole('heading', { name: 'Edit form template' }),
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
  await page.getByRole('textbox', { name: 'Form template' }).click();
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

  const notesFieldId = forms[0]!.fields.find((f) => f.label === 'Notes')!.id;
  await page.locator(`[data-path="${notesFieldId}"]`).fill('First report');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved')).toBeVisible();

  await page.getByRole('link', { name: /Login bug/ }).click();
  await page.getByRole('link', { name: 'View response' }).click();
  await expect(page.getByText('Incomplete')).toBeVisible();
  await expect(page.getByText('First report')).toBeVisible();

  await page.getByRole('link', { name: 'Edit response' }).click();
  const reporterFieldId = forms[0]!.fields.find(
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
