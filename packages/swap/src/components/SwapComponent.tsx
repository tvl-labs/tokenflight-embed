import { createSignal, Show, onMount, onCleanup, createMemo } from "solid-js";
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
import { toBaseUnits, toDisplayAmount, formatDisplayAmount } from "../core/amount-utils";
import { getBestOverallSwapRouteId } from "../core/rank-offers";
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
  const [fromBalance, setFromBalance] = createSignal<string | null>(null);
  let quoteAbortController: AbortController | null = null;

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

  // Cleanup abort controller
  onCleanup(() => {
    quoteAbortController?.abort();
  });

  // Fetch balance for from token
  const fetchFromBalance = async () => {
    const c = client();
    const addr = walletAddress();
    const from = sm.state().fromToken;
    if (!c || !addr || !from || !from.decimals) {
      setFromBalance(null);
      return;
    }
    try {
      const balances = await c.getTokenBalances(addr, { chainIds: [from.chainId] });
      const match = balances.find(
        (tk) => tk.address.toLowerCase() === from.address.toLowerCase() && tk.chainId === from.chainId,
      );
      if (match?.extensions?.balance) {
        setFromBalance(
          formatDisplayAmount(toDisplayAmount(match.extensions.balance, match.decimals), 4),
        );
      } else {
        setFromBalance("0");
      }
    } catch {
      setFromBalance(null);
    }
  };

  // Request quote when amount changes (streaming)
  const handleAmountChange = async (amount: string) => {
    sm.setInputAmount(amount);
    props.callbacks?.onAmountChanged?.({ amount, direction: "from" });

    // Abort any in-flight streaming request
    quoteAbortController?.abort();
    quoteAbortController = null;

    const state = sm.state();
    if (!amount || parseFloat(amount) <= 0 || !state.fromToken || !state.toToken || !client()) {
      sm.setOutputAmount("");
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
          slippageTolerance: props.config.slippage ? props.config.slippage / 100 : undefined,
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
    if (!props.walletAdapter) return;
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
      const depositData = await client()!.depositBuild({
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

      // Poll order status
      const pollOrder = async () => {
        try {
          const order = await client()!.getOrderById(walletAddress()!, submitResult.orderId);
          if (!order) {
            setTimeout(pollOrder, 3000);
            return;
          }
          sm.setOrder(order);

          if (order.status === "filled") {
            sm.transition("success");
            props.callbacks?.onSwapSuccess?.({
              orderId: order.id,
              fromToken: state.fromToken!.symbol ?? state.fromToken!.address,
              toToken: state.toToken!.symbol ?? state.toToken!.address,
              fromAmount: order.srcAmount,
              toAmount: order.destAmount,
              txHash: order.depositTxHash,
            });
          } else if (order.status === "failed" || order.status === "refunded") {
            sm.setError("Order " + order.status, ErrorCode.ORDER_FAILED);
            props.callbacks?.onSwapError?.({
              code: ErrorCode.ORDER_FAILED,
              message: "Order " + order.status,
            });
          } else {
            setTimeout(pollOrder, 3000);
          }
        } catch {
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
      decimals: token.decimals,
      logoURI: token.logoURI,
    };
    if (selectorOpen() === "from") {
      sm.setFromToken(resolved);
      fetchFromBalance();
    } else {
      sm.setToToken(resolved);
    }
    setSelectorOpen(null);
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
            <Show when={isConnected() && fromBalance()}>
              <span class="tf-panel-balance">
                {t("swap.balance", { balance: fromBalance()! })}
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
                <TokenIcon symbol={state().fromToken!.symbol ?? "?"} color="#2775CA" size={24} logoURI={state().fromToken!.logoURI} />
                <span class="tf-token-name">{state().fromToken!.symbol}</span>
                <span class="tf-caret">{"\u25BE"}</span>
              </button>
            </Show>
          </div>
          <div class="tf-panel-footer">
            <Show when={state().inputAmount}>
              <span class="tf-fiat">{t("swap.fiatValue", { value: state().inputAmount })}</span>
            </Show>
            <Show when={isConnected() && fromBalance()}>
              <button class="tf-max-btn" onClick={handleMaxClick}>
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
              when={state().phase !== "quoting" || state().isStreaming}
              fallback={<div class="tf-skeleton" style={{ width: "120px", height: "28px" }} />}
            >
              <span
                class={`tf-amount ${!showQuote() ? "tf-amount--muted" : ""}`}
                style={{ cursor: "default" }}
              >
                {showQuote() || state().isStreaming ? state().outputAmount || "0" : "0"}
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
                <TokenIcon symbol={state().toToken!.symbol ?? "?"} color="#0052FF" size={24} logoURI={state().toToken!.logoURI} />
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
      <Show when={showQuote() && bestRoute() && state().fromToken && state().toToken}>
        <QuotePreview
          route={bestRoute()!}
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

      {/* Explorer Link */}
      <Show when={state().phase === "success" && state().order?.depositTxHash}>
        <StatusDisplay txHash={state().order!.depositTxHash} />
      </Show>

      <PoweredByKhalani />

      {/* Token Selector Overlay */}
      <Show when={selectorOpen() !== null}>
        <div class="tf-selector-overlay">
          <TokenSelector
            client={client()}
            selectingFor={selectorOpen()!}
            onSelect={handleTokenSelect}
            onClose={() => setSelectorOpen(null)}
          />
        </div>
      </Show>
    </div>
  );
}
