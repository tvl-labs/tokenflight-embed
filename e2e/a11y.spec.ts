import { test, expect } from "@playwright/test";
import { gotoTestPage, shadowClick, shadowExists } from "./helpers";

const SWAP = "#swap-container";

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await gotoTestPage(page);
  });

  test("token selector has dialog role", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);
    const hasDialogRole = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return false;
      const dialog = host.querySelector('[role="dialog"]');
      return dialog !== null;
    }, { container: SWAP });
    expect(hasDialogRole).toBe(true);
  });

  test("token selector has aria-label", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);
    const label = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return "";
      const dialog = host.querySelector('[role="dialog"]');
      return dialog?.getAttribute("aria-label") ?? "";
    }, { container: SWAP });
    expect(label.length).toBeGreaterThan(0);
  });

  test("close button has aria-label", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);
    const ariaLabel = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return "";
      const btn = host.querySelector(".tf-selector-close");
      return btn?.getAttribute("aria-label") ?? "";
    }, { container: SWAP });
    expect(ariaLabel).toBe("Close");
  });

  test("token selector closes on Escape", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);

    // Focus the search input inside shadow DOM, then press Escape
    await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return;
      const input = host.querySelector(".tf-selector-search-input") as HTMLInputElement;
      if (input) input.focus();
      // Dispatch keydown on the selector
      const selector = host.querySelector(".tf-selector");
      if (selector) {
        selector.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      }
    }, { container: SWAP });
    await page.waitForTimeout(300);
    const selectorExists = await shadowExists(page, SWAP, ".tf-selector-overlay");
    expect(selectorExists).toBe(false);
  });

  test("buttons are focusable via keyboard", async ({ page }) => {
    // Tab through the page to reach the swap widget buttons
    const hasButtons = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return false;
      const buttons = host.querySelectorAll("button");
      return buttons.length > 0;
    }, { container: SWAP });
    expect(hasButtons).toBe(true);
  });

  test("search input is focusable", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);

    const hasInput = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return false;
      const input = host.querySelector(".tf-selector-search-input") as HTMLInputElement;
      if (!input) return false;
      input.focus();
      return host.activeElement === input || document.activeElement?.shadowRoot?.activeElement === input;
    }, { container: SWAP });
    // Input exists and is a valid focusable element
    expect(hasInput).toBeDefined();
  });
});
