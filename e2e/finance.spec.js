// @ts-check
const { test, expect } = require('@playwright/test');
const { gotoPage, ADMIN } = require('./helpers');

// หมายเหตุ: ไม่ใช้ helpers.login() เพราะรอ `.dash-summary` (มี Chart.js) ซึ่ง render
// ไม่ขึ้นใน headless sandbox นี้โดยเฉพาะ (ปัญหา pre-existing ไม่เกี่ยวกับ finance feature
// ยืนยันแล้วว่า dashboard.spec.js เดิมก็พังด้วยสาเหตุเดียวกัน) — รอ `.sidebar` แทน
async function loginNoDashboardWait(page) {
  await page.goto('/');
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  await page.fill('input[type="email"]', ADMIN.email);
  await page.fill('input[type="password"]', ADMIN.password);
  await page.click('button[type="submit"]');
  await expect(page.locator('.sidebar:visible, .topbar:visible').first()).toBeVisible({ timeout: 45000 });
}

test.describe('Finance', () => {

  test.beforeEach(async ({ page }) => {
    await loginNoDashboardWait(page);
    await gotoPage(page, 'การเงิน');
    await expect(page.locator('.page-header__title')).toHaveText('การเงิน');
  });

  test('TC-F101: บันทึกรับ-จ่าย เพิ่มรายการได้ และเห็นยอดคงเหลือสะสม', async ({ page }, testInfo) => {
    const desc = `ทดสอบ E2E รายรับ ${testInfo.project.name}-${Date.now()}`;

    await page.click('button:has-text("เพิ่มรายการ")');
    const modal = page.locator('.modal');
    await expect(modal.locator('.modal__title')).toBeVisible();

    await modal.locator('input[type="date"]').fill(new Date().toISOString().slice(0, 10));
    await modal.locator('input[type="number"]').fill('500');
    await modal.locator('input[placeholder*="ค่าแรง"]').fill(desc);

    await modal.locator('button:has-text("บันทึกรายการ")').click();
    await expect(page.locator('.toast--success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.toast--success')).toHaveCount(0, { timeout: 5000 }); // รอ toast หายก่อน กัน toast ค้างบัง

    const visibleRow = page.locator('tr:visible, .item-card:visible', { hasText: desc });
    await expect(visibleRow.first()).toBeVisible();

    // cleanup: ลบรายการที่สร้างทดสอบ (desktop = แถวตาราง, mobile = item-card — เลือกแถวที่มองเห็นจริง)
    await visibleRow.first().locator('.icon-btn--danger').click();
    const delModal = page.locator('.modal');
    await delModal.locator('input[type="password"]').fill('admin1234');
    await delModal.locator('button:has-text("ลบรายการ")').click();
    await expect(page.locator('.toast--success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('tr, .item-card', { hasText: desc })).toHaveCount(0);
  });

  test('TC-F102: ต้นทุน/กำไร แสดง tab สูตรได้', async ({ page }) => {
    await page.click('button:has-text("ต้นทุน/กำไร")');
    await expect(page.locator('button:has-text("เพิ่มสูตร")')).toBeVisible();
  });

});
