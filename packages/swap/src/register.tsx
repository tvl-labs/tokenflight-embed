import { customElement } from "solid-element";
import { QueryClientProvider } from "@tanstack/solid-query";
import { SwapComponent } from "./components/SwapComponent";
import { ReceiveComponent } from "./components/ReceiveComponent";
import { baseStyles } from "./styles/base";
import { getThemeVars, buildCssVarString } from "./styles/theme";
import { parseTokenIdentifier } from "./core/caip10";
import { queryClient } from "./core/query-client";

export function registerElements() {
  if (typeof customElements === "undefined") return;

  if (!customElements.get("tokenflight-swap")) {
    customElement("tokenflight-swap", {
      "api-endpoint": "",
      "from-token": "",
      "to-token": "",
      theme: "light" as string,
      locale: "en-US",
      "csp-nonce": "",
    }, (props, { element }) => {
      const config = {
        apiEndpoint: props["api-endpoint"] || undefined,
        fromToken: props["from-token"] || undefined,
        toToken: props["to-token"] || undefined,
        theme: (props.theme || "light") as "light" | "dark" | "auto",
        locale: props.locale || "en-US",
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

      const walletAdapter = (element as any).__walletAdapter;
      const callbacks = (element as any).__callbacks;

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
      theme: "light" as string,
      locale: "en-US",
      "csp-nonce": "",
      icon: "",
    }, (props, { element }) => {
      const targetToken = props.target ? parseTokenIdentifier(props.target) : { chainId: 1, address: "" };

      const config = {
        apiEndpoint: props["api-endpoint"] || undefined,
        target: targetToken,
        amount: props.amount || "0",
        fromToken: props["from-token"] || undefined,
        theme: (props.theme || "light") as "light" | "dark" | "auto",
        locale: props.locale || "en-US",
        icon: props.icon || undefined,
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

      const walletAdapter = (element as any).__walletAdapter;
      const callbacks = (element as any).__callbacks;

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
