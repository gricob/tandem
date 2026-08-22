import { expect, test } from '@playwright/test';

interface Deliverable {
  id: string;
  name: string;
  description: string | null;
  userStories: unknown[];
}

let nextId = 1;
function id(): string {
  return `id-${nextId++}`;
}

test('creates a deliverable, edits it, and deletes it', async ({ page }) => {
  const deliverables: Deliverable[] = [];

  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({ status: 200, json: { accessToken: 'e2e-session-token' } });
  });

  await page.route('**/api/v1/deliverables', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: deliverables });
      return;
    }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as {
        name: string;
        description?: string;
      };
      const deliverable: Deliverable = {
        id: id(),
        name: body.name,
        description: body.description ?? null,
        userStories: [],
      };
      deliverables.push(deliverable);
      await route.fulfill({ status: 201, json: deliverable });
      return;
    }
    await route.continue();
  });

  await page.route(/\/api\/v1\/deliverables\/[^/]+$/, async (route) => {
    const deliverableId = new URL(route.request().url()).pathname
      .split('/')
      .pop()!;
    const deliverable = deliverables.find((d) => d.id === deliverableId);
    if (!deliverable) {
      await route.fulfill({ status: 404, json: {} });
      return;
    }

    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: deliverable });
      return;
    }
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as {
        name?: string;
        description?: string;
      };
      if (body.name !== undefined) {
        deliverable.name = body.name;
      }
      if (body.description !== undefined) {
        deliverable.description = body.description;
      }
      await route.fulfill({ status: 200, json: deliverable });
      return;
    }
    if (route.request().method() === 'DELETE') {
      deliverables.splice(deliverables.indexOf(deliverable), 1);
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  await page.getByLabel(/password/i).fill('correct-password');
  await page.getByRole('button', { name: 'Enter' }).click();

  await page.getByRole('link', { name: 'Deliverables' }).click();
  await expect(
    page.getByRole('heading', { name: 'Deliverables' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'New deliverable' }).click();
  await page.getByLabel('Name').fill('Reporting dashboard');
  await page.getByLabel('Description').fill('Internal metrics');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(
    page.getByRole('heading', { name: 'Edit deliverable' }),
  ).toBeVisible();

  await page.getByLabel('Name').fill('Reporting dashboard v2');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('link', { name: '← Deliverables' }).click();
  await expect(page.getByText('Reporting dashboard v2')).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(
    page.getByText('No deliverables yet. Create one to get started.'),
  ).toBeVisible();
});
