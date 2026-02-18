import { test, expect } from "@playwright/test";
import { gotoTestPage, shadowCssVar } from "./helpers";

const SWAP = "#swap-container";
const RECEIVE = "#receive-container";

test.describe("Theme System", () => {
  test.beforeEach(async ({ page }) => {
    await gotoTestPage(page);
  });

  test("renders in dark theme by default", async ({ page }) => {
    const bg = await shadowCssVar(page, SWAP, "--tf-bg");
    // Dark theme --tf-bg is #0d0f14
    expect(bg).toBe("#0d0f14");
  });

  test("switches to light theme", async ({ page }) => {
    await page.click('[data-testid="btn-theme-light"]');
    await page.waitForTimeout(500);
    const bg = await shadowCssVar(page, SWAP, "--tf-bg");
    // Light theme --tf-bg is #ffffff
    expect(bg).toBe("#ffffff");
  });

  test("switches back to dark theme", async ({ page }) => {
    await page.click('[data-testid="btn-theme-light"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="btn-theme-dark"]');
    await page.waitForTimeout(500);
    const bg = await shadowCssVar(page, SWAP, "--tf-bg");
    expect(bg).toBe("#0d0f14");
  });

  test("dark theme accent color is correct", async ({ page }) => {
    const accent = await shadowCssVar(page, SWAP, "--tf-accent");
    expect(accent).toBe("#8B7CF6");
  });

  test("light theme accent color is correct", async ({ page }) => {
    await page.click('[data-testid="btn-theme-light"]');
    await page.waitForTimeout(500);
    const accent = await shadowCssVar(page, SWAP, "--tf-accent");
    expect(accent).toBe("#6C5CE7");
  });

  test("theme applies to both swap and receive widgets", async ({ page }) => {
    await page.click('[data-testid="btn-theme-light"]');
    await page.waitForTimeout(500);
    const swapBg = await shadowCssVar(page, SWAP, "--tf-bg");
    const receiveBg = await shadowCssVar(page, RECEIVE, "--tf-bg");
    expect(swapBg).toBe("#ffffff");
    expect(receiveBg).toBe("#ffffff");
  });

  test("dark theme text color is correct", async ({ page }) => {
    const text = await shadowCssVar(page, SWAP, "--tf-text");
    expect(text).toBe("#eef0f6");
  });

  test("light theme text color is correct", async ({ page }) => {
    await page.click('[data-testid="btn-theme-light"]');
    await page.waitForTimeout(500);
    const text = await shadowCssVar(page, SWAP, "--tf-text");
    expect(text).toBe("#0f1419");
  });

  test("dark theme success color is correct", async ({ page }) => {
    const success = await shadowCssVar(page, SWAP, "--tf-success");
    expect(success).toBe("#34D399");
  });

  test("dark theme error color is correct", async ({ page }) => {
    const error = await shadowCssVar(page, SWAP, "--tf-error");
    expect(error).toBe("#F87171");
  });
});
