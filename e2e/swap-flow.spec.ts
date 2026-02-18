import { test, expect } from "@playwright/test";
import {
  gotoTestPage,
  shadowText,
  shadowClick,
  shadowType,
  shadowExists,
  connectWallet,
  disconnectWallet,
} from "./helpers";

const SWAP = "#swap-container";

test.describe("Swap Widget Flow", () => {
  test.beforeEach(async ({ page }) => {
    await gotoTestPage(page);
  });

  test("renders swap widget with header", async ({ page }) => {
    const title = await shadowText(page, SWAP, ".tf-header-title");
    expect(title).toBe("TokenFlight");
  });

  test("shows Connect Wallet button when disconnected", async ({ page }) => {
    const btnText = await shadowText(page, SWAP, ".tf-btn-connect");
    expect(btnText).toBe("Connect Wallet");
  });

  test("shows Select token buttons initially", async ({ page }) => {
    const exists = await shadowExists(page, SWAP, ".tf-token-btn--select");
    expect(exists).toBe(true);
  });

  test("opens token selector when clicking Select token", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);
    const selectorExists = await shadowExists(page, SWAP, ".tf-selector");
    expect(selectorExists).toBe(true);
  });

  test("shows wallet address after connecting", async ({ page }) => {
    await connectWallet(page);
    const addr = await shadowText(page, SWAP, ".tf-wallet-address");
    expect(addr).toMatch(/^0xd8dA\.\.\.6045$/);
  });

  test("wallet connection shows balance in from panel", async ({ page }) => {
    await connectWallet(page);
    const balance = await shadowText(page, SWAP, ".tf-panel-balance");
    expect(balance).toContain("Balance:");
  });

  test("shows MAX button after connecting", async ({ page }) => {
    await connectWallet(page);
    const maxExists = await shadowExists(page, SWAP, ".tf-max-btn");
    expect(maxExists).toBe(true);
  });

  test("hides wallet info after disconnecting", async ({ page }) => {
    await connectWallet(page);
    let addr = await shadowExists(page, SWAP, ".tf-wallet-address");
    expect(addr).toBe(true);

    await disconnectWallet(page);
    addr = await shadowExists(page, SWAP, ".tf-wallet-address");
    expect(addr).toBe(false);
  });

  test("shows Powered by Khalani footer", async ({ page }) => {
    const footer = await shadowText(page, SWAP, ".tf-footer");
    expect(footer).toContain("KHALANI");
  });

  test("has accent line at top", async ({ page }) => {
    const exists = await shadowExists(page, SWAP, ".tf-accent-line");
    expect(exists).toBe(true);
  });

  test("has swap arrow between panels", async ({ page }) => {
    const arrowText = await shadowText(page, SWAP, ".tf-swap-arrow-inner");
    expect(arrowText).toBe("\u2193");
  });

  test("shows Review Swap button when not quoted", async ({ page }) => {
    await connectWallet(page);
    const btnText = await shadowText(page, SWAP, ".tf-btn-primary");
    expect(btnText).toBe("Review Swap");
  });
});

test.describe("Swap Token Selector", () => {
  test.beforeEach(async ({ page }) => {
    await gotoTestPage(page);
  });

  test("opens with search input", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);
    const searchExists = await shadowExists(page, SWAP, ".tf-selector-search-input");
    expect(searchExists).toBe(true);
  });

  test("shows popular tokens chips", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);
    const populars = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return [];
      return Array.from(host.querySelectorAll(".tf-popular-token-name")).map(
        (el) => el.textContent?.trim()
      );
    }, { container: SWAP });
    expect(populars).toContain("USDC");
    expect(populars).toContain("ETH");
  });

  test("shows chain filter tabs", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);
    const chains = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return [];
      return Array.from(host.querySelectorAll(".tf-chain-filter-btn")).map(
        (el) => el.textContent?.trim()
      );
    }, { container: SWAP });
    expect(chains).toContain("All Chains");
    expect(chains).toContain("Ethereum");
    expect(chains).toContain("Base");
  });

  test("shows token list items", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);
    const itemCount = await page.evaluate(({ container }) => {
      const host = document.querySelector(container)?.querySelector("div")?.shadowRoot;
      if (!host) return 0;
      return host.querySelectorAll(".tf-token-list-item").length;
    }, { container: SWAP });
    expect(itemCount).toBeGreaterThan(0);
  });

  test("selects a token and updates display", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);
    // Click the first token in the list
    await shadowClick(page, SWAP, ".tf-token-list-item");
    await page.waitForTimeout(300);
    // Selector should close
    const selectorExists = await shadowExists(page, SWAP, ".tf-selector-overlay");
    expect(selectorExists).toBe(false);
    // Token name should now display
    const tokenName = await shadowText(page, SWAP, ".tf-token-name");
    expect(tokenName.length).toBeGreaterThan(0);
  });

  test("closes on close button click", async ({ page }) => {
    await shadowClick(page, SWAP, ".tf-token-btn--select");
    await page.waitForTimeout(300);
    await shadowClick(page, SWAP, ".tf-selector-close");
    await page.waitForTimeout(300);
    const selectorExists = await shadowExists(page, SWAP, ".tf-selector-overlay");
    expect(selectorExists).toBe(false);
  });
});
