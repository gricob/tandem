import { expect, test, type Route } from '@playwright/test';

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

let nextId = 1;
function id(): string {
  return `id-${nextId++}`;
}

test('creates a form template, adds a select field, removes a field, and deletes the form template', async ({
  page,
}) => {
  const formTemplates: FormTemplate[] = [];

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

    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: formTemplate });
      return;
    }
    if (route.request().method() === 'DELETE') {
      formTemplates.splice(formTemplates.indexOf(formTemplate), 1);
      await route.fulfill({ status: 204, body: '' });
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

  await page.route(
    /\/api\/v1\/form-templates\/[^/]+\/fields\/order$/,
    async (route) => {
      const formTemplateId = new URL(route.request().url()).pathname
        .split('/')
        .at(-3)!;
      const formTemplate = formTemplates.find(
        (ft) => ft.id === formTemplateId,
      )!;
      const { fieldIds } = route.request().postDataJSON() as {
        fieldIds: string[];
      };
      formTemplate.templateFields = fieldIds.map((fieldId, index) => {
        const field = formTemplate.templateFields.find(
          (f) => f.id === fieldId,
        )!;
        return { ...field, orderIndex: index };
      });
      await route.fulfill({ status: 200, json: formTemplate });
    },
  );

  await page.route(
    /\/api\/v1\/form-templates\/[^/]+\/fields\/[^/]+$/,
    async (route: Route) => {
      if (route.request().method() !== 'DELETE') {
        await route.continue();
        return;
      }
      const parts = new URL(route.request().url()).pathname.split('/');
      const fieldId = parts.at(-1)!;
      const formTemplateId = parts.at(-3)!;
      const formTemplate = formTemplates.find(
        (ft) => ft.id === formTemplateId,
      )!;
      formTemplate.templateFields = formTemplate.templateFields.filter(
        (f) => f.id !== fieldId,
      );
      await route.fulfill({ status: 204, body: '' });
    },
  );

  await page.goto('/');
  await page.getByLabel(/password/i).fill('correct-password');
  await page.getByRole('button', { name: 'Enter' }).click();

  await page.getByRole('link', { name: 'Form templates' }).click();
  await expect(
    page.getByRole('heading', { name: 'Form templates' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'New form template' }).click();
  await page.getByLabel('Name').fill('Bug report');
  await page.getByLabel('Description').fill('Info needed to triage a bug');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(
    page.getByRole('heading', { name: 'Edit form template' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add field' }).click();
  await page.getByRole('textbox', { name: 'Label' }).fill('Severity');
  await page.getByRole('textbox', { name: 'Field type' }).click();
  await page.getByRole('option', { name: 'Select (single choice)' }).click();
  const optionsInput = page.getByRole('textbox', { name: 'Options' });
  await optionsInput.fill('Low');
  await optionsInput.press('Enter');
  await optionsInput.fill('High');
  await optionsInput.press('Enter');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  await expect(page.getByText('Severity')).toBeVisible();
  await expect(page.getByText('Low, High')).toBeVisible();

  await page.getByRole('button', { name: 'Add field' }).click();
  await page.getByLabel('Label').fill('Description');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit Description' })).toBeVisible();

  // Drag-and-drop reordering (@dnd-kit) is exercised manually and covered by
  // the reorder endpoint's backend tests; @dnd-kit's pointer sensor does not
  // reliably respond to Playwright's synthesized input events here.
  const reorderHandles = page.locator('button[aria-label^="Reorder "]');
  await expect(reorderHandles.first()).toHaveAttribute('aria-label', 'Reorder Severity');

  await page.getByRole('button', { name: 'Remove Description' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('button', { name: 'Edit Description' })).not.toBeVisible();

  await page.getByRole('link', { name: '← Form templates' }).click();
  await expect(page.getByText('Bug report')).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(
    page.getByText('No form templates yet. Create one to get started.'),
  ).toBeVisible();
});
