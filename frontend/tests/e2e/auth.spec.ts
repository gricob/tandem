import { expect, test } from '@playwright/test';

test('gates the app behind a login screen', async ({ page }) => {
  await page.route('**/api/v1/auth/login', async (route) => {
    const { email, password } = route.request().postDataJSON() as {
      email: string;
      password: string;
    };

    if (email === 'admin@example.com' && password === 'correct-password') {
      await route.fulfill({ status: 200, json: { accessToken: 'e2e-session-token' } });
    } else {
      await route.fulfill({ status: 401, json: {} });
    }
  });

  await page.goto('/');
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();

  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Incorrect email or password.')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();

  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('correct-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(
    page.getByText(
      "Plan and track your team's workstreams and deliverables in one place.",
    ),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByText(
      "Plan and track your team's workstreams and deliverables in one place.",
    ),
  ).toBeVisible();
});
