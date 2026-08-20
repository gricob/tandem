import { expect, test } from '@playwright/test';

test('landing page shows the Tandem heading', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Tandem' })).toBeVisible();
});
