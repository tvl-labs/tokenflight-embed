import { type Page, type Locator } from "@playwright/test";

/**
 * Navigate to the E2E test page and wait for widgets to be ready.
 */
export async function gotoTestPage(page: Page) {
  await page.goto("/e2e-test.html");
  // Wait for the custom event that signals widgets are initialized
  await page.waitForFunction(() => {
    return document.getElementById("status-text")?.textContent === "Widgets ready";
  }, { timeout: 10000 });
}

/**
 * Get a locator inside a shadow root of the swap widget.
 */
export function swapShadow(page: Page): Locator {
  return page.locator("#swap-container div").first();
}

/**
 * Get a locator inside a shadow root of the receive widget.
 */
export function receiveShadow(page: Page): Locator {
  return page.locator("#receive-container div").first();
}

/**
 * Query inside a shadow DOM using evaluate.
 * Returns the text content of the first match.
 */
export async function shadowText(
  page: Page,
  containerSelector: string,
  innerSelector: string
): Promise<string> {
  return page.evaluate(
    ({ container, inner }) => {
      const host = document.querySelector(container)
        ?.querySelector("div")
        ?.shadowRoot;
      if (!host) return "";
      const el = host.querySelector(inner);
      return el?.textContent?.trim() ?? "";
    },
    { container: containerSelector, inner: innerSelector }
  );
}

/**
 * Click inside a shadow DOM.
 */
export async function shadowClick(
  page: Page,
  containerSelector: string,
  innerSelector: string
): Promise<void> {
  await page.evaluate(
    ({ container, inner }) => {
      const host = document.querySelector(container)
        ?.querySelector("div")
        ?.shadowRoot;
      if (!host) throw new Error(`Shadow root not found: ${container}`);
      const el = host.querySelector(inner) as HTMLElement;
      if (!el) throw new Error(`Element not found in shadow: ${inner}`);
      el.click();
    },
    { container: containerSelector, inner: innerSelector }
  );
}

/**
 * Type into an input inside a shadow DOM.
 */
export async function shadowType(
  page: Page,
  containerSelector: string,
  innerSelector: string,
  text: string
): Promise<void> {
  await page.evaluate(
    ({ container, inner, value }) => {
      const host = document.querySelector(container)
        ?.querySelector("div")
        ?.shadowRoot;
      if (!host) throw new Error(`Shadow root not found: ${container}`);
      const el = host.querySelector(inner) as HTMLInputElement;
      if (!el) throw new Error(`Input not found in shadow: ${inner}`);
      // Trigger Solid's input handling
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeInputValueSetter?.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { container: containerSelector, inner: innerSelector, value: text }
  );
}

/**
 * Check if an element exists inside a shadow DOM.
 */
export async function shadowExists(
  page: Page,
  containerSelector: string,
  innerSelector: string
): Promise<boolean> {
  return page.evaluate(
    ({ container, inner }) => {
      const host = document.querySelector(container)
        ?.querySelector("div")
        ?.shadowRoot;
      if (!host) return false;
      return host.querySelector(inner) !== null;
    },
    { container: containerSelector, inner: innerSelector }
  );
}

/**
 * Get computed CSS variable value from shadow host.
 */
export async function shadowCssVar(
  page: Page,
  containerSelector: string,
  varName: string
): Promise<string> {
  return page.evaluate(
    ({ container, name }) => {
      const host = document.querySelector(container)
        ?.querySelector("div")
        ?.shadowRoot?.host;
      if (!host) return "";
      return getComputedStyle(host).getPropertyValue(name).trim();
    },
    { container: containerSelector, name: varName }
  );
}

/**
 * Connect the mock wallet via the test page button.
 */
export async function connectWallet(page: Page) {
  await page.click('[data-testid="btn-connect"]');
  await page.waitForTimeout(500);
}

/**
 * Disconnect the mock wallet via the test page button.
 */
export async function disconnectWallet(page: Page) {
  await page.click('[data-testid="btn-disconnect"]');
  await page.waitForTimeout(500);
}
