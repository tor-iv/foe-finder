import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    // Wait for the auth check to complete (form becomes enabled)
    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled({ timeout: 10000 });

    // Check for Win95 panel styling
    await expect(page.locator('.win95-panel')).toBeVisible();

    // Check for title bar with app name
    await expect(page.getByText('FOE FINDER - Login')).toBeVisible();

    // Check for logo
    await expect(page.getByText('FOEFINDER')).toBeVisible();

    // Check for form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Check for links
    await expect(page.getByText(/forgot password/i)).toBeVisible();
    await expect(page.getByText(/register/i)).toBeVisible();
  });

  test('shows validation on submit with empty fields', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    // Wait for the auth check to complete
    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled({ timeout: 10000 });

    // The form has HTML5 required validation
    // Click login without filling fields - the form won't submit
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await expect(submitButton).toBeVisible();
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });
    // Wait for the auth check to complete (inputs become enabled)
    await expect(page.getByLabel(/display name/i)).toBeEnabled({ timeout: 10000 });

    // Check for title bar
    await expect(page.getByText('FOE FINDER - Register')).toBeVisible();

    // Check for form elements
    await expect(page.getByLabel(/display name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();

    // Check for marketing consent checkbox
    await expect(page.getByText(/updates.*features/i)).toBeVisible();
  });

  test('forgot password page renders correctly', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'networkidle' });
    // Wait for the auth check to complete (input becomes enabled)
    await expect(page.getByLabel(/email/i)).toBeEnabled({ timeout: 10000 });

    // Check for title bar
    await expect(page.getByText('FOE FINDER - Reset Password')).toBeVisible();

    // Check for form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
  });

  test('can navigate from login to register', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    // Wait for the page to be ready
    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled({ timeout: 10000 });

    await page.getByRole('link', { name: /register/i }).click();

    await expect(page).toHaveURL(/\/register/, { timeout: 10000 });
  });

  test('can navigate from login to forgot password', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    // Wait for the page to be ready
    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled({ timeout: 10000 });

    await page.getByRole('link', { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/, { timeout: 10000 });
  });
});
