import { test, expect } from '@playwright/test';

// Note: These tests require authentication to access protected routes.
// For now, we'll test the components in isolation by mocking the auth state.
// In a real setup, you'd need test credentials or a mock auth setup.

test.describe('Age Gate', () => {
  test.skip('age gate appears on protected routes', async ({ page }) => {
    // This test requires authentication setup
    // Skip until we have proper auth mocking
  });

  test.skip('age gate shows error for underage user', async ({ page }) => {
    // This test requires authentication setup
  });

  test.skip('age gate accepts valid age and dismisses', async ({ page }) => {
    // This test requires authentication setup
  });
});

test.describe('Intro Modal', () => {
  test.skip('intro modal appears after age verification', async ({ page }) => {
    // This test requires authentication setup
  });

  test.skip('intro modal dismisses on button click', async ({ page }) => {
    // This test requires authentication setup
  });
});

// Test that protected routes redirect to login when not authenticated
test.describe('Route Protection', () => {
  test('profile redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/profile');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('FOE FINDER - Login')).toBeVisible();
  });

  test('questionnaire redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/questionnaire');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('FOE FINDER - Login')).toBeVisible();
  });

  test('results redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/results');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('FOE FINDER - Login')).toBeVisible();
  });
});
