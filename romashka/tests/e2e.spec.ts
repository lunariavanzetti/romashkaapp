import { test, expect } from '@playwright/test';

test('complete user journey', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}); 