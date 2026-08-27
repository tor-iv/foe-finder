import { test as setup } from '@playwright/test';

const APP_STORE = JSON.stringify({
  state: { introSeen: true, ageVerified: true, geoVerified: true },
  version: 0,
});

async function login(page: import('@playwright/test').Page, email: string, statePath: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill('nemesis-pass-1');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(questionnaire|results|game|profile)?$/, { timeout: 15000 });
  await page.evaluate((store) => localStorage.setItem('foe-finder-app', store), APP_STORE);
  await page.context().storageState({ path: statePath });
}

setup('authenticate user A', async ({ page }) => {
  await login(page, 'nemesis-a@foefinder.test', 'playwright/.auth/user-a.json');
});

setup('authenticate user B (admin)', async ({ page }) => {
  await login(page, 'nemesis-b@foefinder.test', 'playwright/.auth/admin.json');
});
