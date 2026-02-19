import { createSignal, Show, onMount, onCleanup, createMemo, createEffect } from "solid-js";
import { AirplaneLogo, TokenIcon, ChainBadge, PoweredByKhalani, ArrowDown, ChevronDown } from "./icons";
import { AmountInput } from "./AmountInput";
import { QuotePreview, QuotePreviewSkeleton } from "./QuotePreview";
import { SignificantNumber } from "./SignificantNumber";
import { ActionButton } from "./ActionButton";
import { StatusDisplay } from "./StatusDisplay";
import { TransactionComplete } from "./TransactionComplete";
import { TokenSelector, type TokenItem } from "./TokenSelector";
import { createSwapStateMachine } from "../state/state-machine";
import { HyperstreamApi, DEFAULT_API_ENDPOINT } from "../api/hyperstream-api";
import { parseTokenIdentifier } from "../helpers/caip10";
import { resolveToken } from "../services/token-resolver";
import { toBaseUnits, toDisplayAmount, formatDisplayAmount } from "../helpers/amount-utils";
import { getBestOverallSwapRouteId } from "../services/rank-offers";
import { loadChains } from "../services/chain-registry";
import { createTokenBalancesQuery, createOrderQuery } from "../queries/queries";
import { t } from "../i18n";
import { setLocale } from "../i18n";
import type { TokenFlightSwapConfig } from "../types/config";
import type { IWalletAdapter } from "../types/wallet";
import type { Callbacks } from "../types/config";
import type { ResolvedToken } from "../types/api";
import { ErrorCode, TokenFlightError } from "../types/errors";

export interface SwapComponentProps {
  config: TokenFlightSwapConfig;
  walletAdapter?: IWalletAdapter;
  callbacks?: Callbacks;
}

export function SwapComponent(props: SwapComponentProps) {
  const sm = createSwapStateMachine();
  const [selectorOpen, setSelectorOpen] = createSignal<"from" | "to" | null>(null);
  const [isConnected, setIsConnected] = createSignal(false);
  const [walletAddress, setWalletAddress] = createSignal<string | null>(null);
  const [trackingOrderId, setTrackingOrderId] = createSignal<string | null>(null);
  let quoteAbortController: AbortController | null = null;

  const client = createMemo(() => {
    const endpoint = props.config.apiEndpoint ?? DEFAULT_API_ENDPOINT;
    return new HyperstreamApi({ baseUrl: endpoint });
  });

  // Token balances query (auto-cached, 30s stale)
  const balancesQuery = createTokenBalancesQuery(
    client,
    walletAddress,
    () => isConnected() && !!walletAddress(),
  );

  const fromBalance = createMemo(() => {
    const from = sm.state().fromToken;
    if (!from || !from.decimals || !balancesQuery.data) return null;
    const match = balancesQuery.data.find(
      (tk: { address: string; chainId: number }) =>
        tk.address.toLowerCase() === from.address.toLowerCase() && tk.chainId === from.chainId,
    );
    if (match?.extensions?.balance) {
      return formatDisplayAmount(toDisplayAmount(match.extensions.balance, match.decimals), 4);
    }
    return "0";
  });

  const fromUnitPriceUsd = createMemo(() => {
    const from = sm.state().fromToken;
    if (!from) return null;

    if (typeof from.priceUsd === "number" && Number.isFinite(from.priceUsd)) {
      return from.priceUsd;
    }

    const match = balancesQuery.data?.find(
      (tk: { address: string; chainId: number; extensions?: { price?: { usd: string } } }) =>
        tk.address.toLowerCase() === from.address.toLowerCase() && tk.chainId === from.chainId,
    );
    const parsed = Number(match?.extensions?.price?.usd ?? "");
    return Number.isFinite(parsed) ? parsed : null;
  });

  const toUnitPriceUsd = createMemo(() => {
    const to = sm.state().toToken;
    if (!to) return null;
    if (typeof to.priceUsd === "number" && Number.isFinite(to.priceUsd)) {
      return to.priceUsd;
    }
    return null;
  });

  const formatUsd = (value: number): string => {
    if (!Number.isFinite(value) || value <= 0) return "0.00";
    if (value >= 1) return value.toFixed(2);
    if (value >= 0.01) return value.toFixed(4);
    return value.toFixed(6);
  };

  const inputFiatText = createMemo(() => {
    const amount = Number(sm.state().inputAmount);
    const price = fromUnitPriceUsd();
    if (!Number.isFinite(amount) || amount <= 0 || price === null) return null;
    return t("swap.fiatValue", { value: formatUsd(amount * price) });
  });

  const outputFiatText = createMemo(() => {
    const amount = Number(sm.state().outputAmount || "0");
    const price = toUnitPriceUsd();
    const phase = sm.state().phase;
    const show =
      phase === "quoted" ||
      phase === "building" ||
      phase === "awaiting-wallet" ||
      phase === "submitting" ||
      phase === "tracking" ||
      phase === "success";
    if (!show || !Number.isFinite(amount) || amount <= 0 || price === null) return null;
    return t("swap.fiatValue", { value: formatUsd(amount * price) });
  });

  // Order polling query (3s interval, stops at terminal status)
  const orderQuery = createOrderQuery(
    client,
    walletAddress,
    trackingOrderId,
    () => sm.state().phase === "tracking" && !!trackingOrderId(),
  );

  createEffect(() => {
    const order = orderQuery.data;
    if (!order || sm.state().phase !== "tracking") return;
    sm.setOrder(order);
    if (order.status === "failed" || order.status === "refunded") {
      sm.setError("Order " + order.status, ErrorCode.ORDER_FAILED);
      props.callbacks?.onSwapError?.({
        code: ErrorCode.ORDER_FAILED,
        message: "Order " + order.status,
      });
      return;
    }
    if (order.status === "filled") {
      sm.transition("success");
      const state = sm.state();
      props.callbacks?.onSwapSuccess?.({
        orderId: order.id,
        fromToken: state.fromToken!.symbol ?? state.fromToken!.address,
        toToken: state.toToken!.symbol ?? state.toToken!.address,
        fromAmount: order.srcAmount,
        toAmount: order.destAmount,
        txHash: order.depositTxHash,
      });
    }
  });

  // Initialize locale
  onMount(() => {
    if (props.config.locale) {
      setLocale(props.config.locale);
    }
  });

  // Load chains and initialize preset tokens
  onMount(async () => {
    const c = client();
    if (c) loadChains(c);
    if (props.config.fromToken) {
      try {
        const target = parseTokenIdentifier(props.config.fromToken);
        const resolved = await resolveToken(target.chainId, target.address, props.config.apiEndpoint, c);
        sm.setFromToken(resolved);
      } catch (err) {
        props.callbacks?.onSwapError?.({
          code: ErrorCode.INVALID_TOKEN_IDENTIFIER,
          message: `Failed to resolve fromToken: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }
    if (props.config.toToken) {
      try {
        const target = parseTokenIdentifier(props.config.toToken);
        const resolved = await resolveToken(target.chainId, target.address, props.config.apiEndpoint, c);
        sm.setToToken(resolved);
      } catch (err) {
        props.callbacks?.onSwapError?.({
          code: ErrorCode.INVALID_TOKEN_IDENTIFIER,
          message: `Failed to resolve toToken: ${err instanceof Error ? err.message : String(err)}`,
        });
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

  // Cleanup abort controller
  onCleanup(() => {
    quoteAbortController?.abort();
  });

  // Request quote when amount changes (streaming)
  const handleAmountChange = async (amount: string) => {
    sm.setInputAmount(amount);
    props.callbacks?.onAmountChanged?.({ amount, direction: "from" });

    // Abort any in-flight streaming request
    quoteAbortController?.abort();
    quoteAbortController = null;

    const state = sm.state();
    if (!amount || parseFloat(amount) <= 0 || !state.fromToken || !state.toToken || !client()) {
      sm.clearRoutes();
      sm.setOutputAmount("");
      if (sm.state().phase !== "idle") {
        sm.transition("idle");
      }
      return;
    }

    const fromDecimals = state.fromToken.decimals ?? 18;
    const toDecimals = state.toToken.decimals ?? 18;
    const baseAmount = toBaseUnits(amount, fromDecimals);

    sm.clearRoutes();
    sm.transition("quoting");
    sm.setStreaming(true);

    const abortController = new AbortController();
    quoteAbortController = abortController;

    try {
      await client()!.getQuotesStream(
        {
          tradeType: "EXACT_INPUT",
          fromChainId: state.fromToken.chainId,
          fromToken: state.fromToken.address,
          toChainId: state.toToken.chainId,
          toToken: state.toToken.address,
          amount: baseAmount,
          fromAddress: walletAddress() ?? "0x0000000000000000000000000000000000000000",
        },
        (route) => {
          sm.addStreamingRoute(route.quoteId, route);

          // Re-rank and update best route
          const allRoutes = sm.state().routes;
          const bestId = getBestOverallSwapRouteId(allRoutes);
          if (bestId) {
            sm.setSelectedRouteId(bestId);
            const bestRoute = allRoutes.find((r) => r.routeId === bestId);
            if (bestRoute) {
              sm.setOutputAmount(
                formatDisplayAmount(toDisplayAmount(bestRoute.quote.amountOut, toDecimals)),
              );
            }
          }
        },
        abortController.signal,
      );

      sm.setStreaming(false);

      if (sm.state().routes.length > 0) {
        sm.transition("quoted");
      } else {
        sm.setError("No routes available", ErrorCode.QUOTE_FAILED);
      }
    } catch (err) {
      sm.setStreaming(false);
      if (abortController.signal.aborted) return; // Intentional abort
      if (err instanceof TokenFlightError) {
        sm.setError(err.message, err.code);
      } else {
        sm.setError(String(err));
      }
    }
  };

  const handleConnect = async () => {
    if (!props.walletAdapter) {
      console.warn(
        "[TokenFlight] No wallet adapter configured. Pass a walletAdapter to enable wallet connection.\n" +
        "See: https://embed.tokenflight.ai/guides/wallet-adapter/"
      );
      props.callbacks?.onConnectWallet?.();
      return;
    }
    try {
      await props.walletAdapter.connect();
    } catch {
      sm.setError("Failed to connect wallet", ErrorCode.WALLET_CONNECTION_FAILED);
    }
  };

  const handleConfirm = async () => {
    const state = sm.state();
    const selectedRoute = state.routes.find((r) => r.routeId === state.selectedRouteId) ?? state.routes[0];
    if (!selectedRoute || !state.quoteId || !client() || !props.walletAdapter) return;

    sm.transition("building");
    try {
      const depositData = await client()!.buildDeposit({
        from: walletAddress()!,
        quoteId: state.quoteId,
        routeId: selectedRoute.routeId,
      });

      sm.transition("awaiting-wallet");

      // Handle CONTRACT_CALL deposit
      let txHash: string | undefined;
      if (depositData.kind === "CONTRACT_CALL" && depositData.approvals) {
        for (const approval of depositData.approvals) {
          if (approval.type === "eip1193_request") {
            const result = await props.walletAdapter.executeWalletAction({
              type: "eip1193_request",
              chainId: state.fromToken!.chainId,
              method: approval.request.method,
              params: approval.request.params,
            });

            if (!result.success) {
              throw new TokenFlightError(
                ErrorCode.WALLET_ACTION_FAILED,
                result.error ?? "Wallet action failed"
              );
            }
            if (approval.deposit) {
              txHash = result.txHash ?? txHash;
            }
          } else if (approval.type === "solana_sendTransaction") {
            const result = await props.walletAdapter.executeWalletAction({
              type: "solana_signAndSendTransaction",
              transaction: approval.transaction,
            });

            if (!result.success) {
              throw new TokenFlightError(
                ErrorCode.WALLET_ACTION_FAILED,
                result.error ?? "Wallet action failed"
              );
            }
            if (approval.deposit) {
              txHash = result.txHash ?? txHash;
            }
          }
        }
      }

      if (!txHash) {
        throw new TokenFlightError(
          ErrorCode.TRANSACTION_FAILED,
          "No deposit transaction hash received"
        );
      }

      sm.transition("submitting");

      const submitResult = await client()!.submitDeposit({
        quoteId: state.quoteId,
        routeId: selectedRoute.routeId,
        txHash,
      });

      sm.transition("tracking");
      setTrackingOrderId(submitResult.orderId);
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

  const handleNewSwap = () => {
    sm.clearRoutes();
    sm.setOutputAmount("");
    sm.setInputAmount("");
    setTrackingOrderId(null);
    sm.transition("idle");
  };

  const handleTokenSelect = (token: TokenItem) => {
    const resolved: ResolvedToken = {
      chainId: token.chainId,
      address: token.address ?? "",
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.logoURI,
      priceUsd: token.priceUsd,
    };
    if (selectorOpen() === "from") {
      sm.setFromToken(resolved);
    } else {
      sm.setToToken(resolved);
    }
    setSelectorOpen(null);

    // Re-quote when token changes while keeping the current amount.
    queueMicrotask(() => {
      const amount = sm.state().inputAmount;
      if (!amount || parseFloat(amount) <= 0) {
        sm.clearRoutes();
        sm.setOutputAmount("");
        if (sm.state().phase !== "idle") {
          sm.transition("idle");
        }
        return;
      }
      void handleAmountChange(amount);
    });
  };

  const handleSwapTokens = () => {
    const current = sm.state();
    const phase = current.phase;
    const isBusy =
      phase === "building" ||
      phase === "awaiting-wallet" ||
      phase === "submitting" ||
      phase === "tracking";

    if (isBusy || !current.fromToken || !current.toToken) return;

    // Cancel any in-flight quote before swapping direction.
    quoteAbortController?.abort();
    quoteAbortController = null;

    sm.setFromToken(current.toToken);
    sm.setToToken(current.fromToken);
    sm.clearRoutes();
    sm.setOutputAmount("");

    // Quote requests cannot transition from success directly to quoting.
    if (phase === "success") {
      sm.transition("idle");
    }

    const amount = current.inputAmount;
    if (!amount || parseFloat(amount) <= 0) {
      if (sm.state().phase !== "idle") {
        sm.transition("idle");
      }
      return;
    }

    void handleAmountChange(amount);
  };

  const handleMaxClick = () => {
    const bal = fromBalance();
    if (bal && bal !== "0") {
      handleAmountChange(bal);
    }
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

  const bestRoute = () => {
    const s = state();
    if (s.routes.length === 0) return null;
    return s.routes.find((r) => r.routeId === s.selectedRouteId) ?? s.routes[0] ?? null;
  };

  const titleText = createMemo(() => {
    const raw = props.config.titleText?.trim();
    return raw && raw.length > 0 ? raw : "TokenFlight";
  });

  const hasCustomTitleText = createMemo(() => {
    const raw = props.config.titleText?.trim();
    return !!raw && raw.length > 0;
  });

  const titleImageUrl = createMemo(() => {
    const raw = props.config.titleImageUrl?.trim();
    return raw && raw.length > 0 ? raw : null;
  });

  const isQuoteLoading = createMemo(() => {
    const s = state();
    if (!s.fromToken || !s.toToken) return false;
    return s.phase === "quoting" && parseFloat(s.inputAmount) > 0 && s.routes.length === 0;
  });

  const quotePreviewRoute = createMemo(() => {
    const s = state();
    const route = bestRoute();
    if (!route || !s.fromToken || !s.toToken) return null;
    if (s.phase === "quoting" || showQuote()) return route;
    return null;
  });

  return (
    <div class={`tf-container${props.config.noBackground ? " tf-container--no-bg" : ""}${props.config.noBorder ? " tf-container--no-border" : ""}`} part="container">
      <div class="tf-accent-line" />

      <Show when={state().phase === "success" && state().order} fallback={
        <>
          {/* Header */}
          <div class="tf-header" part="header">
            <div class={`tf-header-left ${props.config.hideTitle ? "tf-header-left--hidden" : ""}`} aria-hidden={props.config.hideTitle ? "true" : undefined}>
              <Show when={titleImageUrl()} fallback={<AirplaneLogo size={22} />}>
                <img src={titleImageUrl()!} alt={titleText()} width="22" height="22" class="tf-header-logo-image" />
              </Show>
              <span class="tf-header-title">
                <Show when={hasCustomTitleText()} fallback={<>Token<span class="tf-header-title-accent">Flight</span></>}>
                  {titleText()}
                </Show>
              </span>
            </div>
            <Show when={isConnected() && walletAddress()}>
              <div class="tf-header-right">
                <div class="tf-wallet-dot" />
                <span class="tf-wallet-address">{truncateAddress(walletAddress()!)}</span>
              </div>
            </Show>
          </div>

          {/* From Panel */}
          <div class="tf-panel-wrapper">
            <div class="tf-panel">
              <div class="tf-panel-header">
                <span class="tf-panel-label">{t("swap.youPay")}</span>
                <Show when={isConnected() && fromBalance()}>
                  <div class="tf-panel-header-right">
                    <span class="tf-panel-balance">
                      {t("swap.balance", { balance: fromBalance()! })}
                    </span>
                    <button class="tf-max-btn" onClick={handleMaxClick}>
                      {t("swap.max")}
                    </button>
                  </div>
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
                      <span class="tf-caret"><ChevronDown size={14} /></span>
                    </button>
                  }
                >
                  <button class="tf-token-btn" part="token-display" onClick={() => setSelectorOpen("from")}>
                    <TokenIcon symbol={state().fromToken!.symbol ?? "?"} color="#2775CA" size={24} logoURI={state().fromToken!.logoURI} />
                    <span class="tf-token-name">{state().fromToken!.symbol}</span>
                    <span class="tf-caret"><ChevronDown size={14} /></span>
                  </button>
                </Show>
              </div>
              <div class="tf-panel-footer">
                <span class={`tf-fiat ${!inputFiatText() ? "tf-fiat--hidden" : ""}`}>
                  {inputFiatText() ?? " "}
                </span>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div class="tf-swap-arrow">
            <button type="button" class="tf-swap-arrow-inner" onClick={handleSwapTokens} aria-label="Swap tokens">
              <ArrowDown size={14} />
            </button>
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
                  when={!isQuoteLoading()}
                  fallback={<div class="tf-skeleton" style={{ width: "120px", height: "28px" }} />}
                >
                  <span
                    class={`tf-amount ${!showQuote() && state().phase !== "quoting" ? "tf-amount--muted" : ""}`}
                    style={{ cursor: "default" }}
                  >
                    <SignificantNumber
                      value={showQuote() || state().phase === "quoting" ? state().outputAmount || "0" : "0"}
                      digits={8}
                    />
                  </span>
                </Show>
                <Show
                  when={state().toToken}
                  fallback={
                    <button class="tf-token-btn tf-token-btn--select" onClick={() => setSelectorOpen("to")}>
                      <span class="tf-token-name--accent">{t("swap.selectToken")}</span>
                      <span class="tf-caret"><ChevronDown size={14} /></span>
                    </button>
                  }
                >
                  <button class="tf-token-btn" part="token-display" onClick={() => setSelectorOpen("to")}>
                    <TokenIcon symbol={state().toToken!.symbol ?? "?"} color="#0052FF" size={24} logoURI={state().toToken!.logoURI} />
                    <span class="tf-token-name">{state().toToken!.symbol}</span>
                    <span class="tf-caret"><ChevronDown size={14} /></span>
                  </button>
                </Show>
              </div>
              <div class="tf-panel-fiat-row">
                <span class={`tf-fiat ${!outputFiatText() ? "tf-fiat--hidden" : ""}`}>
                  {outputFiatText() ?? " "}
                </span>
              </div>
            </div>
          </div>

          {/* Quote Preview */}
          <Show when={isQuoteLoading()}>
            <QuotePreviewSkeleton />
          </Show>
          <Show when={quotePreviewRoute() && state().fromToken && state().toToken}>
            <QuotePreview
              route={quotePreviewRoute()!}
              fromToken={state().fromToken!}
              toToken={state().toToken!}
            />
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
        </>
      }>
        <TransactionComplete
          order={state().order!}
          fromToken={state().fromToken}
          toToken={state().toToken}
          onNewSwap={handleNewSwap}
        />
      </Show>

      <Show when={!props.config.hidePoweredBy}>
        <PoweredByKhalani />
      </Show>

      {/* Token Selector Overlay */}
      <Show when={selectorOpen() !== null}>
        <div class="tf-selector-overlay">
          <TokenSelector
            client={client()}
            walletAddress={walletAddress()}
            selectingFor={selectorOpen()!}
            onSelect={handleTokenSelect}
            onClose={() => setSelectorOpen(null)}
          />
        </div>
      </Show>
    </div>
  );
}
