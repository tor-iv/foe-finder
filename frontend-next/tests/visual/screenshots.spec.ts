import { test } from '@playwright/test';
import path from 'node:path';

const OUT = 'polish-shots'; // outside test-results, which Playwright wipes per run

function shot(projectName: string, slug: string) {
  return path.join(OUT, projectName, `${slug}.png`);
}

// Public screens — no auth state
const PUBLIC_ROUTES: Array<[string, string]> = [
  ['/login', 'login'],
  ['/register', 'register'],
  ['/forgot-password', 'forgot-password'],
  ['/reset-password?token=invalid-token', 'reset-password'],
  ['/verify-email?error=invalid_token', 'verify-email--error'],
  ['/verify-email', 'verify-email--success'],
];

// Authenticated screens — user A state (matched, questionnaire complete)
const USER_ROUTES: Array<[string, string]> = [
  ['/', 'dashboard'],
  ['/questionnaire', 'questionnaire'],
  ['/game', 'game'],
  ['/results', 'results'],
  ['/profile', 'profile'],
];

test.describe('public screens', () => {
  for (const [route, slug] of PUBLIC_ROUTES) {
    test(`shot ${slug}`, async ({ page }, testInfo) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(600); // let framer-motion entrances settle
      await page.screenshot({ path: shot(testInfo.project.name, slug), fullPage: true });
    });
  }
});

test.describe('user screens', () => {
  test.use({ storageState: 'playwright/.auth/user-a.json' });
  for (const [route, slug] of USER_ROUTES) {
    test(`shot ${slug}`, async ({ page }, testInfo) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Session resolves client-side after hydration — wait for the authed navbar
      await page.getByRole('navigation').getByRole('button', { name: /logout/i }).waitFor({ timeout: 10000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: shot(testInfo.project.name, slug), fullPage: true });
    });
  }
});

test.describe('admin screen', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });
  test('shot admin', async ({ page }, testInfo) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.getByRole('navigation').getByRole('button', { name: /logout/i }).waitFor({ timeout: 10000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: shot(testInfo.project.name, 'admin'), fullPage: true });
  });
});
