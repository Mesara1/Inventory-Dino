// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('Auth Flow', () => {

  test('TC-F001: Login ด้วย credentials ถูกต้อง → ไป Dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.fill('input[type="email"]', 'admin@dinopop.com');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button[type="submit"]');
    await expect(page.locator('.dash-summary')).toBeVisible({ timeout: 45000 });
  });

  test('TC-F002: Login ด้วย password ผิด → แสดง error message', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@dinopop.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.form-msg--error')).toBeVisible({ timeout: 5000 });
  });

  test('TC-F003: Logout → กลับหน้า Login', async ({ page }) => {
    await login(page);
    await page.locator('.sidebar__logout, .topbar__logout').filter({ visible: true }).first().click();
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 5000 });
  });

});
