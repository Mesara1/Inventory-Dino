// @ts-check
const { test, expect } = require('@playwright/test');
const { login, openQtyModal } = require('./helpers');

test.describe('Update Quantity Modal', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-F007: เปิด qty modal ได้', async ({ page }) => {
    await openQtyModal(page);
    await expect(page.locator('.qty-modal')).toBeVisible();
  });

  test('TC-F008: qty modal ไม่ overflow บน mobile (iPhone SE 375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await openQtyModal(page);

    const pad = page.locator('.qty-modal__pad');
    await expect(pad).toBeVisible();
    const box = await pad.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x + box.width).toBeLessThanOrEqual(376); // ไม่เกิน viewport
  });

  test('TC-F009: ใส่จำนวนลบเกิน → ปุ่มยืนยัน disable', async ({ page }) => {
    await openQtyModal(page);

    await page.click('.qty-modal__mode-btn:last-child'); // เบิกออก
    await page.fill('.qty-modal__input', '99999');
    await expect(page.locator('button:has-text("ยืนยัน")')).toBeDisabled();
  });

  test('TC-F010: ปิด modal ด้วยปุ่มยกเลิก', async ({ page }) => {
    await openQtyModal(page);
    await page.click('button:has-text("ยกเลิก")');
    await expect(page.locator('.qty-modal')).not.toBeVisible();
  });

});
