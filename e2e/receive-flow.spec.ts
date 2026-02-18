import { test, expect } from "@playwright/test";
import {
  gotoTestPage,
  shadowText,
  shadowClick,
  shadowExists,
  connectWallet,
} from "./helpers";

const RECEIVE = "#receive-container";

test.describe("Receive Widget Flow", () => {
  test.beforeEach(async ({ page }) => {
    await gotoTestPage(page);
  });

  test("renders receive widget with header", async ({ page }) => {
    const title = await shadowText(page, RECEIVE, ".tf-header-title");
    expect(title).toBe("TokenFlight");
  });

  test("shows target receive amount", async ({ page }) => {
    const amount = await shadowText(page, RECEIVE, ".tf-receive-amount");
    expect(amount).toBe("100");
  });

  test("shows target token symbol", async ({ page }) => {
    const symbol = await shadowText(page, RECEIVE, ".tf-receive-symbol");
    expect(symbol.length).toBeGreaterThan(0);
  });

  test("shows You receive label", async ({ page }) => {
    const label = await shadowText(page, RECEIVE, ".tf-receive-section-label");
    expect(label).toContain("You receive");
  });

  test("shows payment token list", async ({ page }) => {
    const count = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return 0;
      return host.querySelectorAll(".tf-pay-token").length;
    }, { container: RECEIVE });
    expect(count).toBeGreaterThan(0);
  });

  test("first payment token has BEST badge", async ({ page }) => {
    const hasBest = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return false;
      const firstRow = host.querySelector(".tf-pay-token");
      return firstRow?.querySelector(".tf-best-badge") !== null;
    }, { container: RECEIVE });
    expect(hasBest).toBe(true);
  });

  test("shows Buy button with amount and symbol", async ({ page }) => {
    await connectWallet(page);
    const btnText = await shadowText(page, RECEIVE, ".tf-btn-primary");
    expect(btnText).toMatch(/Buy.*100/);
  });

  test("shows Browse all tokens link", async ({ page }) => {
    const linkExists = await shadowExists(page, RECEIVE, ".tf-browse-all");
    expect(linkExists).toBe(true);
  });

  test("shows Powered by Khalani footer", async ({ page }) => {
    const footer = await shadowText(page, RECEIVE, ".tf-footer");
    expect(footer).toContain("KHALANI");
  });

  test("has accent line at top", async ({ page }) => {
    const exists = await shadowExists(page, RECEIVE, ".tf-accent-line");
    expect(exists).toBe(true);
  });

  test("shows Connect Wallet when disconnected", async ({ page }) => {
    const btnText = await shadowText(page, RECEIVE, ".tf-btn-connect");
    expect(btnText).toBe("Connect Wallet");
  });

  test("disabled token row has reduced opacity", async ({ page }) => {
    const opacity = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return "1";
      const rows = host.querySelectorAll(".tf-pay-token");
      for (const row of rows) {
        if (row.classList.contains("tf-pay-token-row--disabled")) {
          return getComputedStyle(row).opacity;
        }
      }
      return "none";
    }, { container: RECEIVE });
    // Either we find a disabled row with reduced opacity, or there are none
    if (opacity !== "none") {
      expect(parseFloat(opacity)).toBeLessThan(1);
    }
  });
});
