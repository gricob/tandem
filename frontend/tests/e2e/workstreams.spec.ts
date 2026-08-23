import { expect, test } from '@playwright/test';

interface Deliverable {
  id: string;
  workstreamId: string;
  orderIndex: number;
  name: string;
  description: string | null;
  userStories: unknown[];
}

interface Workstream {
  id: string;
  name: string;
  description: string | null;
  deliverables: Deliverable[];
}

let nextId = 1;
function id(): string {
  return `id-${nextId++}`;
}

test('creates a workstream, manages its deliverables, and deletes it', async ({
  page,
}) => {
  const workstreams: Workstream[] = [];
  const deliverables: Deliverable[] = [];

  function toWorkstreamResponse(workstream: Workstream) {
    return {
      ...workstream,
      deliverables: deliverables.filter((d) => d.workstreamId === workstream.id),
    };
  }

  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      json: { accessToken: 'e2e-session-token' },
    });
  });

  await page.route('**/api/v1/workstreams', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        json: workstreams.map(toWorkstreamResponse),
      });
      return;
    }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as {
        name: string;
        description?: string;
      };
      const workstream: Workstream = {
        id: id(),
        name: body.name,
        description: body.description ?? null,
        deliverables: [],
      };
      workstreams.push(workstream);
      await route.fulfill({
        status: 201,
        json: toWorkstreamResponse(workstream),
      });
      return;
    }
    await route.continue();
  });

  await page.route(
    /\/api\/v1\/workstreams\/[^/]+\/deliverables$/,
    async (route) => {
      const workstreamId = new URL(route.request().url()).pathname
        .split('/')
        .at(-2)!;
      const body = route.request().postDataJSON() as {
        name: string;
        description?: string;
      };
      const orderIndex = deliverables.filter(
        (d) => d.workstreamId === workstreamId,
      ).length;
      const deliverable: Deliverable = {
        id: id(),
        workstreamId,
        orderIndex,
        name: body.name,
        description: body.description ?? null,
        userStories: [],
      };
      deliverables.push(deliverable);
      await route.fulfill({ status: 201, json: deliverable });
    },
  );

  await page.route(/\/api\/v1\/workstreams\/[^/]+$/, async (route) => {
    const workstreamId = new URL(route.request().url()).pathname
      .split('/')
      .pop()!;
    const workstream = workstreams.find((w) => w.id === workstreamId);
    if (!workstream) {
      await route.fulfill({ status: 404, json: {} });
      return;
    }

    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        json: toWorkstreamResponse(workstream),
      });
      return;
    }
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as {
        name?: string;
        description?: string;
      };
      if (body.name !== undefined) {
        workstream.name = body.name;
      }
      if (body.description !== undefined) {
        workstream.description = body.description;
      }
      await route.fulfill({
        status: 200,
        json: toWorkstreamResponse(workstream),
      });
      return;
    }
    if (route.request().method() === 'DELETE') {
      workstreams.splice(workstreams.indexOf(workstream), 1);
      await route.fulfill({ status: 204, body: '' });
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

  await page.getByRole('link', { name: 'Workstreams' }).click();
  await expect(
    page.getByRole('heading', { name: 'Workstreams' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'New workstream' }).click();
  await page.getByLabel('Name').fill('Platform');
  await page.getByLabel('Description').fill('Core platform work');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(
    page.getByRole('heading', { name: 'Edit workstream' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'New deliverable' }).click();
  const newDeliverableDialog = page.getByRole('dialog', {
    name: 'New deliverable',
  });
  await newDeliverableDialog.getByLabel('Name').fill('Reporting dashboard');
  await newDeliverableDialog
    .getByLabel('Description')
    .fill('Internal metrics');
  await newDeliverableDialog.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText('Reporting dashboard')).toBeVisible();

  await page.getByRole('link', { name: 'Reporting dashboard' }).click();
  await expect(
    page.getByRole('heading', { name: 'Edit deliverable' }),
  ).toBeVisible();

  await page.getByLabel('Name').fill('Reporting dashboard v2');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('link', { name: '← Workstream' }).click();
  await expect(
    page.getByRole('heading', { name: 'Edit workstream' }),
  ).toBeVisible();
  await expect(page.getByText('Reporting dashboard v2')).toBeVisible();

  await page.getByRole('button', { name: 'Remove Reporting dashboard v2' }).click();
  await expect(
    page.getByText('No deliverables yet. Add one above.'),
  ).toBeVisible();

  await page.getByRole('link', { name: '← Workstreams' }).click();
  await expect(page.getByRole('link', { name: 'Platform' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(
    page.getByText('No workstreams yet. Create one to get started.'),
  ).toBeVisible();
});
