import { customElement } from "solid-element";
import { QueryClientProvider } from "@tanstack/solid-query";
import { SwapComponent } from "./components/SwapComponent";
import { ReceiveComponent } from "./components/ReceiveComponent";
import { baseStyles } from "./styles/base";
import { getThemeVars, buildCssVarString } from "./styles/theme";
import { parseTokenIdentifier } from "./helpers/caip10";
import { queryClient } from "./queries/query-client";
import type { Callbacks } from "./types/config";
import type { IWalletAdapter } from "./types/wallet";

function parseBooleanProp(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "" || normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }
  return undefined;
}

export interface RegisterElementsOptions {
  walletAdapter?: IWalletAdapter;
  callbacks?: Callbacks;
}

let defaultWalletAdapter: IWalletAdapter | undefined;
let defaultCallbacks: Callbacks | undefined;

export function registerElements(options: RegisterElementsOptions = {}) {
  // Allow updating defaults even after custom elements are already registered.
  if ("walletAdapter" in options) {
    defaultWalletAdapter = options.walletAdapter;
  }
  if ("callbacks" in options) {
    defaultCallbacks = options.callbacks;
  }

  if (typeof customElements === "undefined") return;

  if (!customElements.get("tokenflight-swap")) {
    customElement("tokenflight-swap", {
      "api-endpoint": "",
      "from-token": "",
      "to-token": "",
      "title-text": "",
      "title-image": "",
      theme: "light" as string,
      locale: "en-US",
      "csp-nonce": "",
      "hide-title": false as boolean | string,
      "hide-powered-by": false as boolean | string,
    }, (props, { element }) => {
      const config = {
        apiEndpoint: props["api-endpoint"] || undefined,
        fromToken: props["from-token"] || undefined,
        toToken: props["to-token"] || undefined,
        titleText: props["title-text"] || undefined,
        titleImageUrl: props["title-image"] || undefined,
        theme: (props.theme || "light") as "light" | "dark" | "auto",
        locale: props.locale || "en-US",
        hideTitle: parseBooleanProp(props["hide-title"]),
        hidePoweredBy: parseBooleanProp(props["hide-powered-by"]),
      };

      // Inject styles into shadow root
      const shadow = element.shadowRoot;
      if (shadow) {
        const style = document.createElement("style");
        const nonce = props["csp-nonce"];
        if (nonce) style.nonce = nonce;

        const themeVars = getThemeVars(config.theme);
        style.textContent = `:host { ${buildCssVarString(themeVars)} }\n${baseStyles}`;
        shadow.prepend(style);
      }

      const elementWalletAdapter = (element as { __walletAdapter?: IWalletAdapter }).__walletAdapter;
      const elementCallbacks = (element as { __callbacks?: Callbacks }).__callbacks;
      const walletAdapter = elementWalletAdapter ?? defaultWalletAdapter;
      const callbacks = elementCallbacks
        ? { ...defaultCallbacks, ...elementCallbacks }
        : defaultCallbacks;

      return (
        <QueryClientProvider client={queryClient}>
          <SwapComponent config={config} walletAdapter={walletAdapter} callbacks={callbacks} />
        </QueryClientProvider>
      );
    });
  }

  if (!customElements.get("tokenflight-receive")) {
    customElement("tokenflight-receive", {
      "api-endpoint": "",
      target: "",
      amount: "",
      "from-token": "",
      "title-text": "",
      "title-image": "",
      theme: "light" as string,
      locale: "en-US",
      "csp-nonce": "",
      icon: "",
      "hide-title": false as boolean | string,
      "hide-powered-by": false as boolean | string,
    }, (props, { element }) => {
      const targetToken = props.target ? parseTokenIdentifier(props.target) : { chainId: 1, address: "" };

      const config = {
        apiEndpoint: props["api-endpoint"] || undefined,
        target: targetToken,
        amount: props.amount || "0",
        fromToken: props["from-token"] || undefined,
        titleText: props["title-text"] || undefined,
        titleImageUrl: props["title-image"] || undefined,
        theme: (props.theme || "light") as "light" | "dark" | "auto",
        locale: props.locale || "en-US",
        icon: props.icon || undefined,
        hideTitle: parseBooleanProp(props["hide-title"]),
        hidePoweredBy: parseBooleanProp(props["hide-powered-by"]),
      };

      const shadow = element.shadowRoot;
      if (shadow) {
        const style = document.createElement("style");
        const nonce = props["csp-nonce"];
        if (nonce) style.nonce = nonce;

        const themeVars = getThemeVars(config.theme);
        style.textContent = `:host { ${buildCssVarString(themeVars)} }\n${baseStyles}`;
        shadow.prepend(style);
      }

      const elementWalletAdapter = (element as { __walletAdapter?: IWalletAdapter }).__walletAdapter;
      const elementCallbacks = (element as { __callbacks?: Callbacks }).__callbacks;
      const walletAdapter = elementWalletAdapter ?? defaultWalletAdapter;
      const callbacks = elementCallbacks
        ? { ...defaultCallbacks, ...elementCallbacks }
        : defaultCallbacks;

      return (
        <QueryClientProvider client={queryClient}>
          <ReceiveComponent config={config} walletAdapter={walletAdapter} callbacks={callbacks} />
        </QueryClientProvider>
      );
    });
  }
}

// Auto-register when script is loaded
if (typeof window !== "undefined") {
  registerElements();
}
