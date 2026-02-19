import { render } from "solid-js/web";
import { QueryClientProvider } from "@tanstack/solid-query";
import { SwapComponent } from "../components/SwapComponent";
import { ReceiveComponent } from "../components/ReceiveComponent";
import { baseStyles } from "../styles/base";
import { getThemeVars, buildCssVarString, applyCustomColors } from "../styles/theme";
import { ErrorCode, TokenFlightError } from "../types/errors";
import { queryClient } from "../queries/query-client";
import type { TokenFlightSwapOptions, TokenFlightReceiveOptions } from "../types/config";
import type { IWalletAdapter } from "../types/wallet";
import type { Callbacks } from "../types/config";

function resolveContainer(container: string | HTMLElement): HTMLElement {
  if (typeof container === "string") {
    const el = document.querySelector(container);
    if (!el) {
      throw new TokenFlightError(
        ErrorCode.ELEMENT_NOT_FOUND,
        `Element not found: ${container}`
      );
    }
    return el as HTMLElement;
  }
  return container;
}

export class TokenFlightSwap {
  private dispose: (() => void) | null = null;
  private container: HTMLElement;
  private config: TokenFlightSwapOptions["config"];
  private walletAdapter?: IWalletAdapter;
  private callbacks?: Callbacks;

  constructor(options: TokenFlightSwapOptions) {
    this.container = resolveContainer(options.container);
    this.config = options.config;
    this.walletAdapter = options.walletAdapter;
    this.callbacks = options.callbacks;
  }

  initialize(): void {
    if (this.dispose) {
      this.destroy();
    }

    // Create shadow root
    const shadowHost = document.createElement("div");
    this.container.appendChild(shadowHost);
    const shadow = shadowHost.attachShadow({ mode: "open" });

    // Inject styles
    const style = document.createElement("style");
    const themeVars = getThemeVars(this.config.theme ?? "light");
    style.textContent = `:host { ${buildCssVarString(themeVars)} }\n${baseStyles}`;
    shadow.appendChild(style);

    const mountPoint = document.createElement("div");
    shadow.appendChild(mountPoint);

    const cfg = this.config;
    const wa = this.walletAdapter;
    const cb = this.callbacks;

    this.dispose = render(
      () => (
        <QueryClientProvider client={queryClient}>
          <SwapComponent config={cfg} walletAdapter={wa} callbacks={cb} />
        </QueryClientProvider>
      ),
      mountPoint
    );
  }

  destroy(): void {
    if (this.dispose) {
      this.dispose();
      this.dispose = null;
    }
    this.container.innerHTML = "";
  }

  setTheme(theme: "light" | "dark" | "auto"): void {
    this.config = { ...this.config, theme };
    const shadow = this.container.querySelector("div")?.shadowRoot;
    if (shadow) {
      const style = shadow.querySelector("style");
      if (style) {
        const themeVars = getThemeVars(theme);
        style.textContent = `:host { ${buildCssVarString(themeVars)} }\n${baseStyles}`;
      }
    }
  }

  setCustomColors(colors: Record<string, string>): void {
    const host = this.container.querySelector("div");
    if (host) {
      applyCustomColors(host, colors);
    }
  }
}

export class TokenFlightReceive {
  private dispose: (() => void) | null = null;
  private container: HTMLElement;
  private config: TokenFlightReceiveOptions["config"];
  private walletAdapter?: IWalletAdapter;
  private callbacks?: Callbacks;

  constructor(options: TokenFlightReceiveOptions) {
    this.container = resolveContainer(options.container);
    this.config = options.config;
    this.walletAdapter = options.walletAdapter;
    this.callbacks = options.callbacks;
  }

  initialize(): void {
    if (this.dispose) {
      this.destroy();
    }

    const shadowHost = document.createElement("div");
    this.container.appendChild(shadowHost);
    const shadow = shadowHost.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    const themeVars = getThemeVars(this.config.theme ?? "light");
    style.textContent = `:host { ${buildCssVarString(themeVars)} }\n${baseStyles}`;
    shadow.appendChild(style);

    const mountPoint = document.createElement("div");
    shadow.appendChild(mountPoint);

    const cfg = this.config;
    const wa = this.walletAdapter;
    const cb = this.callbacks;

    this.dispose = render(
      () => (
        <QueryClientProvider client={queryClient}>
          <ReceiveComponent config={cfg} walletAdapter={wa} callbacks={cb} />
        </QueryClientProvider>
      ),
      mountPoint
    );
  }

  destroy(): void {
    if (this.dispose) {
      this.dispose();
      this.dispose = null;
    }
    this.container.innerHTML = "";
  }

  setTheme(theme: "light" | "dark" | "auto"): void {
    this.config = { ...this.config, theme };
    const shadow = this.container.querySelector("div")?.shadowRoot;
    if (shadow) {
      const style = shadow.querySelector("style");
      if (style) {
        const themeVars = getThemeVars(theme);
        style.textContent = `:host { ${buildCssVarString(themeVars)} }\n${baseStyles}`;
      }
    }
  }

  setCustomColors(colors: Record<string, string>): void {
    const host = this.container.querySelector("div");
    if (host) {
      applyCustomColors(host, colors);
    }
  }
}
