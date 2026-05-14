// helpers.js — shared helpers for all E2E tests
const { expect } = require('@playwright/test');

const ADMIN = { email: 'admin@dinopop.com', password: 'admin1234' };

async function login(page, user = ADMIN) {
  await page.goto('/');
  await page.waitForSelector('input[type="email"]', { timeout: 60000 }); // รอ Babel โหลด (slow on mobile)
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await expect(page.locator('.dash-summary')).toBeVisible({ timeout: 45000 });
}

async function openQtyModal(page) {
  const mobileBtn = page.locator('button:has-text("อัปเดตจำนวน")').first();
  const stockEditBtn = page.locator('.stock-edit-btn').first();

  if (await mobileBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await mobileBtn.click();
  } else {
    // Desktop: คลิก "แก้ไขสต็อก" ก่อน แล้วคลิก qty badge
    await stockEditBtn.click();
    await page.locator('.icon-btn--qty').first().click();
  }
  await expect(page.locator('.qty-modal')).toBeVisible({ timeout: 5000 });
}

module.exports = { login, openQtyModal, ADMIN };
