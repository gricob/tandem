import { expect, test, type Route } from '@playwright/test';

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

let nextId = 1;
function id(): string {
  return `id-${nextId++}`;
}

test('creates a form type, adds a select field, removes a field, and deletes the form type', async ({
  page,
}) => {
  const formTypes: FormType[] = [];

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

    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: formType });
      return;
    }
    if (route.request().method() === 'DELETE') {
      formTypes.splice(formTypes.indexOf(formType), 1);
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    await route.continue();
  });

  await page.route(/\/api\/v1\/form-types\/[^/]+\/fields$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const formTypeId = new URL(route.request().url()).pathname.split('/').at(-2)!;
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

  await page.route(/\/api\/v1\/form-types\/[^/]+\/fields\/order$/, async (route) => {
    const formTypeId = new URL(route.request().url()).pathname.split('/').at(-3)!;
    const formType = formTypes.find((ft) => ft.id === formTypeId)!;
    const { fieldIds } = route.request().postDataJSON() as { fieldIds: string[] };
    formType.fields = fieldIds.map((fieldId, index) => {
      const field = formType.fields.find((f) => f.id === fieldId)!;
      return { ...field, orderIndex: index };
    });
    await route.fulfill({ status: 200, json: formType });
  });

  await page.route(/\/api\/v1\/form-types\/[^/]+\/fields\/[^/]+$/, async (route: Route) => {
    if (route.request().method() !== 'DELETE') {
      await route.continue();
      return;
    }
    const parts = new URL(route.request().url()).pathname.split('/');
    const fieldId = parts.at(-1)!;
    const formTypeId = parts.at(-3)!;
    const formType = formTypes.find((ft) => ft.id === formTypeId)!;
    formType.fields = formType.fields.filter((f) => f.id !== fieldId);
    await route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/');
  await page.getByLabel(/password/i).fill('correct-password');
  await page.getByRole('button', { name: 'Enter' }).click();

  await page.getByRole('link', { name: 'Form types' }).click();
  await expect(page.getByRole('heading', { name: 'Form types' })).toBeVisible();

  await page.getByRole('button', { name: 'New form type' }).click();
  await page.getByLabel('Name').fill('Bug report');
  await page.getByLabel('Description').fill('Info needed to triage a bug');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('heading', { name: 'Edit form type' })).toBeVisible();

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

  await page.getByRole('link', { name: '← Form types' }).click();
  await expect(page.getByText('Bug report')).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No form types yet. Create one to get started.')).toBeVisible();
});
