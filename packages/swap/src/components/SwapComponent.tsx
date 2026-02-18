import { createSignal, createEffect, Show, onMount, onCleanup, createMemo } from "solid-js";
import { AirplaneLogo, TokenIcon, ChainBadge, PoweredByKhalani } from "./icons";
import { AmountInput } from "./AmountInput";
import { QuotePreview } from "./QuotePreview";
import { ActionButton } from "./ActionButton";
import { StatusDisplay } from "./StatusDisplay";
import { TokenSelector, type TokenItem } from "./TokenSelector";
import { createSwapStateMachine } from "../core/state-machine";
import { KhalaniClient } from "../core/khalani-client";
import { parseTokenIdentifier } from "../core/caip10";
import { resolveToken } from "../core/token-resolver";
import { t } from "../i18n";
import { setLocale } from "../i18n";
import type { TokenFlightSwapConfig } from "../types/config";
import type { IWalletAdapter } from "../types/wallet";
import type { Callbacks } from "../types/config";
import type { ResolvedToken } from "../types/api";
import type { SwapPhase } from "../types/state";
import { ErrorCode, TokenFlightError } from "../types/errors";

export interface SwapComponentProps {
  config: TokenFlightSwapConfig;
  walletAdapter?: IWalletAdapter;
  callbacks?: Callbacks;
}

// Mock token list for demo (will be replaced by API data)
const DEMO_TOKENS: TokenItem[] = [
  { symbol: "USDC", name: "USD Coin", chain: "Ethereum", chainId: 1, color: "#2775CA", balance: "2,847.52", usd: "$2,847.52" },
  { symbol: "ETH", name: "Ethereum", chain: "Ethereum", chainId: 1, color: "#627EEA", balance: "1.4821", usd: "$4,928.30" },
  { symbol: "USDC", name: "USD Coin", chain: "Base", chainId: 8453, color: "#0052FF", balance: "500.00", usd: "$500.00" },
  { symbol: "USDT", name: "Tether", chain: "Ethereum", chainId: 1, color: "#26A17B", balance: "1,200.00", usd: "$1,200.00" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", chain: "Ethereum", chainId: 1, color: "#F7931A", balance: "0.0234", usd: "$2,284.12" },
  { symbol: "DAI", name: "Dai", chain: "Ethereum", chainId: 1, color: "#F5AC37", balance: "320.18", usd: "$320.18" },
  { symbol: "ARB", name: "Arbitrum", chain: "Arbitrum", chainId: 42161, color: "#28A0F0", balance: "450.00", usd: "$382.50" },
  { symbol: "USDC", name: "USD Coin", chain: "Arbitrum", chainId: 42161, color: "#2775CA", balance: "0", usd: "$0.00" },
  { symbol: "SOL", name: "Solana", chain: "Solana", chainId: 20011000000, color: "#9945FF", balance: "12.50", usd: "$2,187.50" },
  { symbol: "USDC", name: "USD Coin", chain: "Solana", chainId: 20011000000, color: "#2775CA", balance: "88.40", usd: "$88.40" },
];

export function SwapComponent(props: SwapComponentProps) {
  const sm = createSwapStateMachine();
  const [selectorOpen, setSelectorOpen] = createSignal<"from" | "to" | null>(null);
  const [isConnected, setIsConnected] = createSignal(false);
  const [walletAddress, setWalletAddress] = createSignal<string | null>(null);

  const client = createMemo(() => {
    const endpoint = props.config.apiEndpoint;
    return endpoint ? new KhalaniClient(endpoint) : null;
  });

  // Initialize locale
  onMount(() => {
    if (props.config.locale) {
      setLocale(props.config.locale);
    }
  });

  // Initialize preset tokens
  onMount(async () => {
    if (props.config.fromToken) {
      try {
        const target = parseTokenIdentifier(props.config.fromToken);
        const resolved = await resolveToken(target.chainId, target.address, props.config.apiEndpoint);
        sm.setFromToken(resolved);
      } catch {
        // Silent failure for invalid token config
      }
    }
    if (props.config.toToken) {
      try {
        const target = parseTokenIdentifier(props.config.toToken);
        const resolved = await resolveToken(target.chainId, target.address, props.config.apiEndpoint);
        sm.setToToken(resolved);
      } catch {
        // Silent failure
      }
    }
  });

  // Check wallet connection
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

  // Request quote when amount changes
  const handleAmountChange = async (amount: string) => {
    sm.setInputAmount(amount);
    props.callbacks?.onAmountChanged?.({ amount, direction: "from" });

    const state = sm.state();
    if (!amount || parseFloat(amount) <= 0 || !state.fromToken || !state.toToken || !client()) {
      return;
    }

    sm.transition("quoting");
    try {
      const quote = await client()!.getQuote({
        fromChainId: state.fromToken.chainId,
        fromTokenAddress: state.fromToken.address,
        toChainId: state.toToken.chainId,
        toTokenAddress: state.toToken.address,
        amount,
        slippage: props.config.slippage,
        senderAddress: walletAddress() ?? undefined,
      });
      sm.setQuote(quote);
      sm.transition("quoted");
      props.callbacks?.onQuoteReceived?.({
        quoteId: quote.quoteId,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        exchangeRate: quote.exchangeRate,
        estimatedFee: quote.estimatedFee,
        estimatedTime: quote.estimatedTime,
        routes: quote.routes.map((r) => ({
          routeId: r.routeId,
          provider: r.provider,
          estimatedOutput: r.estimatedOutput,
          estimatedFee: r.estimatedFee,
          estimatedTime: r.estimatedTime,
        })),
      });
    } catch (err) {
      if (err instanceof TokenFlightError) {
        sm.setError(err.message, err.code);
      } else {
        sm.setError(String(err));
      }
    }
  };

  const handleConnect = async () => {
    if (!props.walletAdapter) return;
    try {
      await props.walletAdapter.connect();
    } catch (err) {
      sm.setError("Failed to connect wallet", ErrorCode.WALLET_CONNECTION_FAILED);
    }
  };

  const handleConfirm = async () => {
    const state = sm.state();
    if (!state.quote || !client() || !props.walletAdapter) return;

    sm.transition("building");
    try {
      const depositData = await client()!.depositBuild({
        quoteId: state.quote.quoteId,
        routeId: state.selectedRouteId ?? state.quote.routes[0]!.routeId,
        senderAddress: walletAddress()!,
      });

      sm.transition("awaiting-wallet");

      let txHash: string | undefined;
      for (const action of depositData.actions) {
        const result = await props.walletAdapter.executeWalletAction({
          type: action.type as "eip1193_request",
          chainId: action.chainId ?? state.fromToken!.chainId,
          method: action.method ?? "eth_sendTransaction",
          params: action.params ?? [],
        });

        if (!result.success) {
          throw new TokenFlightError(
            ErrorCode.WALLET_ACTION_FAILED,
            result.error ?? "Wallet action failed"
          );
        }
        txHash = result.txHash ?? txHash;
      }

      sm.transition("submitting");

      const order = await client()!.submitDeposit({
        quoteId: state.quote.quoteId,
        routeId: state.selectedRouteId ?? state.quote.routes[0]!.routeId,
        txHash: txHash!,
        senderAddress: walletAddress()!,
      });

      sm.setOrder(order);
      sm.transition("tracking");

      // Poll order status
      const pollOrder = async () => {
        const updated = await client()!.getOrder(order.orderId);
        sm.setOrder(updated);
        if (updated.status === "completed") {
          sm.transition("success");
          props.callbacks?.onSwapSuccess?.({
            orderId: updated.orderId,
            fromToken: state.fromToken!.symbol ?? state.fromToken!.address,
            toToken: state.toToken!.symbol ?? state.toToken!.address,
            fromAmount: updated.fromAmount,
            toAmount: updated.toAmount,
            txHash: updated.txHash ?? txHash!,
          });
        } else if (updated.status === "failed" || updated.status === "refunded") {
          sm.setError(updated.error ?? "Order failed", ErrorCode.ORDER_FAILED);
          props.callbacks?.onSwapError?.({
            code: ErrorCode.ORDER_FAILED,
            message: updated.error ?? "Order failed",
          });
        } else {
          setTimeout(pollOrder, 3000);
        }
      };
      setTimeout(pollOrder, 3000);
    } catch (err) {
      if (err instanceof TokenFlightError) {
        sm.setError(err.message, err.code);
        props.callbacks?.onSwapError?.({
          code: err.code,
          message: err.message,
          details: err.details,
        });
      } else {
        sm.setError(String(err));
        props.callbacks?.onSwapError?.({
          code: ErrorCode.TRANSACTION_FAILED,
          message: String(err),
        });
      }
    }
  };

  const handleRetry = () => {
    sm.transition("quoted");
  };

  const handleTokenSelect = (token: TokenItem) => {
    const resolved: ResolvedToken = {
      chainId: token.chainId,
      address: token.address ?? "",
      symbol: token.symbol,
      name: token.name,
    };
    if (selectorOpen() === "from") {
      sm.setFromToken(resolved);
    } else {
      sm.setToToken(resolved);
    }
    setSelectorOpen(null);
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const state = () => sm.state();
  const showQuote = () => {
    const p = state().phase;
    return (
      p === "quoted" ||
      p === "building" ||
      p === "awaiting-wallet" ||
      p === "submitting" ||
      p === "tracking" ||
      p === "success"
    );
  };
  const isExecuting = () => {
    const p = state().phase;
    return p === "building" || p === "awaiting-wallet" || p === "submitting" || p === "tracking";
  };

  return (
    <div class="tf-container" part="container">
      <div class="tf-accent-line" />

      {/* Header */}
      <div class="tf-header" part="header">
        <div class="tf-header-left">
          <AirplaneLogo size={22} />
          <span class="tf-header-title">{t("swap.title")}</span>
        </div>
        <Show when={isConnected() && walletAddress()}>
          <div class="tf-header-right">
            <div class={`tf-wallet-dot ${state().phase === "success" ? "tf-wallet-dot--success" : ""}`} />
            <span class="tf-wallet-address">{truncateAddress(walletAddress()!)}</span>
          </div>
        </Show>
      </div>

      {/* From Panel */}
      <div class="tf-panel-wrapper">
        <div class="tf-panel">
          <div class="tf-panel-header">
            <span class="tf-panel-label">{t("swap.youPay")}</span>
            <Show when={isConnected()}>
              <span class="tf-panel-balance">
                {t("swap.balance", { balance: "2,847.52" })}
              </span>
            </Show>
          </div>
          <div class="tf-panel-row">
            <AmountInput
              value={state().inputAmount}
              onChange={handleAmountChange}
              disabled={isExecuting()}
            />
            <Show
              when={state().fromToken}
              fallback={
                <button class="tf-token-btn tf-token-btn--select" onClick={() => setSelectorOpen("from")}>
                  <span class="tf-token-name--accent">{t("swap.selectToken")}</span>
                  <span class="tf-caret">{"\u25BE"}</span>
                </button>
              }
            >
              <button class="tf-token-btn" part="token-display" onClick={() => setSelectorOpen("from")}>
                <TokenIcon symbol={state().fromToken!.symbol ?? "?"} color="#2775CA" size={24} />
                <span class="tf-token-name">{state().fromToken!.symbol}</span>
                <span class="tf-caret">{"\u25BE"}</span>
              </button>
            </Show>
          </div>
          <div class="tf-panel-footer">
            <Show when={state().inputAmount}>
              <span class="tf-fiat">{t("swap.fiatValue", { value: state().inputAmount })}</span>
            </Show>
            <Show when={isConnected()}>
              <button class="tf-max-btn" onClick={() => handleAmountChange("2847.52")}>
                {t("swap.max")}
              </button>
            </Show>
          </div>
        </div>
      </div>

      {/* Swap Arrow */}
      <div class="tf-swap-arrow">
        <div class="tf-swap-arrow-inner">{"\u2193"}</div>
      </div>

      {/* To Panel */}
      <div class="tf-panel-wrapper--to">
        <div class="tf-panel">
          <div class="tf-panel-header">
            <span class="tf-panel-label">{t("swap.youReceive")}</span>
            <Show when={state().toToken}>
              <ChainBadge chain={state().toToken?.name ?? "Base"} />
            </Show>
          </div>
          <div class="tf-panel-row">
            <Show
              when={state().phase !== "quoting"}
              fallback={<div class="tf-skeleton" style={{ width: "120px", height: "28px" }} />}
            >
              <span
                class={`tf-amount ${!showQuote() ? "tf-amount--muted" : ""}`}
                style={{ cursor: "default" }}
              >
                {showQuote() ? state().outputAmount || "0" : "0"}
              </span>
            </Show>
            <Show
              when={state().toToken}
              fallback={
                <button class="tf-token-btn tf-token-btn--select" onClick={() => setSelectorOpen("to")}>
                  <span class="tf-token-name--accent">{t("swap.selectToken")}</span>
                  <span class="tf-caret">{"\u25BE"}</span>
                </button>
              }
            >
              <button class="tf-token-btn" part="token-display" onClick={() => setSelectorOpen("to")}>
                <TokenIcon symbol={state().toToken!.symbol ?? "?"} color="#0052FF" size={24} />
                <span class="tf-token-name">{state().toToken!.symbol}</span>
                <span class="tf-caret">{"\u25BE"}</span>
              </button>
            </Show>
          </div>
          <Show when={showQuote()}>
            <span class="tf-fiat" style={{ "margin-top": "6px", display: "block" }}>
              {t("swap.fiatValue", { value: state().outputAmount || "0" })}
            </span>
          </Show>
        </div>
      </div>

      {/* Quote Preview */}
      <Show when={showQuote() && state().quote}>
        <QuotePreview quote={state().quote!} />
      </Show>

      {/* CTA Button */}
      <div class="tf-cta-wrapper">
        <ActionButton
          phase={state().phase}
          isConnected={isConnected()}
          hasQuote={showQuote()}
          onConnect={handleConnect}
          onConfirm={handleConfirm}
          onRetry={handleRetry}
        />
      </div>

      {/* Explorer Link */}
      <Show when={state().phase === "success" && state().order?.txHash}>
        <StatusDisplay txHash={state().order!.txHash} />
      </Show>

      <PoweredByKhalani />

      {/* Token Selector Overlay */}
      <Show when={selectorOpen() !== null}>
        <div class="tf-selector-overlay">
          <TokenSelector
            tokens={DEMO_TOKENS}
            selectingFor={selectorOpen()!}
            onSelect={handleTokenSelect}
            onClose={() => setSelectorOpen(null)}
          />
        </div>
      </Show>
    </div>
  );
}
