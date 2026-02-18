import { test, expect } from "@playwright/test";
import { gotoTestPage, connectWallet, shadowClick, shadowExists } from "./helpers";

test.describe("Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await gotoTestPage(page);
  });

  test("swap widget - disconnected state (dark)", async ({ page }) => {
    await page.waitForTimeout(500);
    const swap = page.locator('[data-testid="swap-container"]');
    await expect(swap).toHaveScreenshot("swap-disconnected-dark.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("swap widget - connected state (dark)", async ({ page }) => {
    await connectWallet(page);
    await page.waitForTimeout(500);
    const swap = page.locator('[data-testid="swap-container"]');
    await expect(swap).toHaveScreenshot("swap-connected-dark.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("swap widget - disconnected state (light)", async ({ page }) => {
    await page.click('[data-testid="btn-theme-light"]');
    await page.waitForTimeout(500);
    const swap = page.locator('[data-testid="swap-container"]');
    await expect(swap).toHaveScreenshot("swap-disconnected-light.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("swap widget - token selector open (dark)", async ({ page }) => {
    await shadowClick(page, "#swap-container", ".tf-token-btn--select");
    await page.waitForTimeout(500);
    const swap = page.locator('[data-testid="swap-container"]');
    await expect(swap).toHaveScreenshot("swap-token-selector-dark.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("receive widget - default state (dark)", async ({ page }) => {
    await page.waitForTimeout(500);
    const receive = page.locator('[data-testid="receive-container"]');
    await expect(receive).toHaveScreenshot("receive-default-dark.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("receive widget - default state (light)", async ({ page }) => {
    await page.click('[data-testid="btn-theme-light"]');
    await page.waitForTimeout(500);
    const receive = page.locator('[data-testid="receive-container"]');
    await expect(receive).toHaveScreenshot("receive-default-light.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("full page - both widgets dark theme", async ({ page }) => {
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("full-page-dark.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("full page - both widgets light theme", async ({ page }) => {
    await page.click('[data-testid="btn-theme-light"]');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("full-page-light.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});
