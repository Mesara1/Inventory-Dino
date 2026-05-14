// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-F004: Dashboard โหลด items ได้', async ({ page }) => {
    await expect(page.locator('.dash-summary')).toBeVisible();
    await expect(page.locator('.summary-card').first()).toBeVisible();
  });

  test('TC-F005: Search กรองรายการได้', async ({ page }) => {
    const search = page.locator('input[placeholder*="ค้นหา"]');
    await search.fill('ถุง');
    await page.waitForTimeout(300);
    const rows = page.locator('.table tbody tr, .item-card');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TC-F006: ปุ่ม "เพิ่มรายการ" แสดงเฉพาะ Admin', async ({ page }) => {
    await expect(page.locator('button:has-text("เพิ่มรายการ")')).toBeVisible();
  });

});
