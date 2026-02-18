import { createSignal, Show, onMount, createMemo } from "solid-js";
import { AirplaneLogo, TokenIcon, PoweredByKhalani } from "./icons";
import { ActionButton } from "./ActionButton";
import { PaymentTokenList, type PaymentToken } from "./PaymentTokenList";
import { TokenSelector, type TokenItem } from "./TokenSelector";
import { createReceiveStateMachine } from "../core/state-machine";
import { KhalaniClient } from "../core/khalani-client";
import { parseTokenIdentifier } from "../core/caip10";
import { resolveToken } from "../core/token-resolver";
import { t } from "../i18n";
import { setLocale } from "../i18n";
import type { TokenFlightReceiveConfig } from "../types/config";
import type { IWalletAdapter } from "../types/wallet";
import type { Callbacks } from "../types/config";
import type { ResolvedToken } from "../types/api";
import { ErrorCode, TokenFlightError } from "../types/errors";

export interface ReceiveComponentProps {
  config: TokenFlightReceiveConfig;
  walletAdapter?: IWalletAdapter;
  callbacks?: Callbacks;
}

const DEMO_PAY_TOKENS: PaymentToken[] = [
  { symbol: "USDC", chain: "Ethereum", color: "#2775CA", amount: "100.16", fee: "0.16", balance: "2,847.52", best: true },
  { symbol: "ETH", chain: "Ethereum", color: "#627EEA", amount: "0.0301", fee: "0.22", balance: "1.4821" },
  { symbol: "USDC", chain: "Arbitrum", color: "#2775CA", amount: "100.24", fee: "0.24", balance: "0", disabled: true },
];

const DEMO_TOKENS: TokenItem[] = [
  { symbol: "USDC", name: "USD Coin", chain: "Ethereum", chainId: 1, color: "#2775CA", balance: "2,847.52", usd: "$2,847.52" },
  { symbol: "ETH", name: "Ethereum", chain: "Ethereum", chainId: 1, color: "#627EEA", balance: "1.4821", usd: "$4,928.30" },
  { symbol: "USDC", name: "USD Coin", chain: "Base", chainId: 8453, color: "#0052FF", balance: "500.00", usd: "$500.00" },
  { symbol: "USDT", name: "Tether", chain: "Ethereum", chainId: 1, color: "#26A17B", balance: "1,200.00", usd: "$1,200.00" },
];

export function ReceiveComponent(props: ReceiveComponentProps) {
  const sm = createReceiveStateMachine();
  const [selectedPayIndex, setSelectedPayIndex] = createSignal(0);
  const [selectorOpen, setSelectorOpen] = createSignal(false);
  const [isConnected, setIsConnected] = createSignal(false);
  const [walletAddress, setWalletAddress] = createSignal<string | null>(null);

  const client = createMemo(() => {
    const endpoint = props.config.apiEndpoint;
    return endpoint ? new KhalaniClient(endpoint) : null;
  });

  onMount(() => {
    if (props.config.locale) {
      setLocale(props.config.locale);
    }
  });

  // Resolve target token
  onMount(async () => {
    try {
      const target = parseTokenIdentifier(props.config.target);
      const resolved = await resolveToken(target.chainId, target.address, props.config.apiEndpoint);
      sm.setTargetToken(resolved);
      sm.setTargetAmount(props.config.amount);
    } catch {
      // Silent failure
    }
  });

  // Check wallet
  onMount(async () => {
    if (props.walletAdapter) {
      const connected = props.walletAdapter.isConnected();
      setIsConnected(connected);
      if (connected) {
        const addr = await props.walletAdapter.getAddress();
        setWalletAddress(addr);
        sm.setWalletAddress(addr);
      }

      props.walletAdapter.on("connect", async () => {
        setIsConnected(true);
        const addr = await props.walletAdapter!.getAddress();
        setWalletAddress(addr);
        sm.setWalletAddress(addr);
        props.callbacks?.onWalletConnected?.({ address: addr ?? "", chainType: "evm" });
      });

      props.walletAdapter.on("disconnect", () => {
        setIsConnected(false);
        setWalletAddress(null);
        sm.setWalletAddress(null);
      });
    }
  });

  const handleConnect = async () => {
    if (!props.walletAdapter) return;
    try {
      await props.walletAdapter.connect();
    } catch {
      sm.setError("Failed to connect wallet", ErrorCode.WALLET_CONNECTION_FAILED);
    }
  };

  const handleConfirm = async () => {
    const state = sm.state();
    if (!client() || !props.walletAdapter) return;

    sm.transition("building");
    try {
      // In a real implementation, this would go through the full flow
      sm.transition("awaiting-wallet");
      sm.transition("submitting");
      sm.transition("tracking");

      // Simulated success for demo
      sm.transition("success");
      props.callbacks?.onSwapSuccess?.({
        orderId: "demo-order-id",
        fromToken: DEMO_PAY_TOKENS[selectedPayIndex()]?.symbol ?? "",
        toToken: state.targetToken?.symbol ?? "",
        fromAmount: DEMO_PAY_TOKENS[selectedPayIndex()]?.amount ?? "",
        toAmount: state.targetAmount,
        txHash: "0x...",
      });
    } catch (err) {
      if (err instanceof TokenFlightError) {
        sm.setError(err.message, err.code);
      } else {
        sm.setError(String(err));
      }
    }
  };

  const handleRetry = () => {
    sm.transition("idle");
  };

  const state = () => sm.state();
  const isExecuting = () => {
    const p = state().phase;
    return p === "building" || p === "awaiting-wallet" || p === "submitting" || p === "tracking";
  };
  const targetSymbol = () => state().targetToken?.symbol ?? "USDC";
  const targetAmount = () => state().targetAmount || props.config.amount;

  return (
    <div class="tf-container" part="container">
      <div class="tf-accent-line" />

      {/* Header (no wallet status) */}
      <div class="tf-receive-header" part="header">
        <AirplaneLogo size={22} />
        <span class="tf-header-title">{t("receive.title")}</span>
      </div>

      {/* You receive section */}
      <div class="tf-receive-section">
        <div class="tf-receive-section-label">{t("receive.youReceive")}</div>
        <div class="tf-receive-target">
          <TokenIcon symbol={targetSymbol()} color="#0052FF" size={32} />
          <span class="tf-receive-amount">{targetAmount()}</span>
          <span class="tf-receive-symbol">{targetSymbol()}</span>
          <span class="tf-receive-fiat">
            {t("swap.fiatValue", { value: targetAmount() })}
          </span>
        </div>
      </div>

      {/* Pay with section */}
      <div class="tf-receive-section" style={{ padding: "0 20px" }}>
        <div class="tf-receive-section-label">{t("receive.payWith")}</div>
      </div>

      <PaymentTokenList
        tokens={DEMO_PAY_TOKENS}
        selectedIndex={state().phase === "success" ? -1 : selectedPayIndex()}
        onSelect={setSelectedPayIndex}
        onBrowseAll={() => setSelectorOpen(true)}
      />

      {/* CTA */}
      <div class="tf-cta-wrapper--receive">
        <ActionButton
          phase={state().phase}
          isConnected={isConnected()}
          hasQuote={true}
          onConnect={handleConnect}
          onConfirm={handleConfirm}
          onRetry={handleRetry}
          label={
            state().phase === "success"
              ? t("receive.success")
              : isExecuting()
                ? undefined
                : t("receive.buy", { amount: targetAmount(), symbol: targetSymbol() })
          }
        />
        <Show when={state().phase === "success"}>
          <div class="tf-explorer-link--receive">
            <a href="#" target="_blank" rel="noopener noreferrer">
              {t("receive.viewExplorer")} {"\u2197"}
            </a>
          </div>
        </Show>
      </div>

      <PoweredByKhalani />

      {/* Token Selector */}
      <Show when={selectorOpen()}>
        <div class="tf-selector-overlay">
          <TokenSelector
            tokens={DEMO_TOKENS}
            selectingFor="from"
            onSelect={(token) => {
              setSelectorOpen(false);
            }}
            onClose={() => setSelectorOpen(false)}
          />
        </div>
      </Show>
    </div>
  );
}
