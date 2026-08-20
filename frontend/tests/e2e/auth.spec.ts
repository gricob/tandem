import { expect, test } from '@playwright/test';

test('gates the app behind a password screen', async ({ page }) => {
  await page.route('**/api/v1/auth/login', async (route) => {
    const { password } = route.request().postDataJSON() as { password: string };

    if (password === 'correct-password') {
      await route.fulfill({ status: 200, json: { accessToken: 'e2e-session-token' } });
    } else {
      await route.fulfill({ status: 401, json: {} });
    }
  });

  await page.goto('/');
  await expect(page.getByLabel(/password/i)).toBeVisible();

  await page.getByLabel(/password/i).fill('wrong-password');
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page.getByText('Incorrect password.')).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();

  await page.getByLabel(/password/i).fill('correct-password');
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(
    page.getByText('Create configurable forms, share them, and review the responses you receive.'),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByText('Create configurable forms, share them, and review the responses you receive.'),
  ).toBeVisible();
});
