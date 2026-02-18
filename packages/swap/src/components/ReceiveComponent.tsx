import { createSignal, Show, onMount, onCleanup, createMemo, createEffect } from "solid-js";
import { AirplaneLogo, TokenIcon, PoweredByKhalani } from "./icons";
import { ActionButton } from "./ActionButton";
import { PaymentTokenList, type PaymentToken } from "./PaymentTokenList";
import { TokenSelector } from "./TokenSelector";
import { createReceiveStateMachine } from "../core/state-machine";
import { KhalaniClient } from "../core/khalani-client";
import { parseTokenIdentifier } from "../core/caip10";
import { resolveToken } from "../core/token-resolver";
import { toBaseUnits, toDisplayAmount, formatDisplayAmount } from "../core/amount-utils";
import { buildOffersForRanking, rankOffers } from "../core/rank-offers";
import { loadChains, getChainDisplay } from "../core/chain-registry";
import { createTokenBalancesQuery, createOrderQuery } from "../core/queries";
import { t } from "../i18n";
import { setLocale } from "../i18n";
import type { TokenFlightReceiveConfig } from "../types/config";
import type { IWalletAdapter } from "../types/wallet";
import type { Callbacks } from "../types/config";
import type { TokenInfo, QuoteRoute } from "../types/api";
import { ErrorCode, TokenFlightError } from "../types/errors";

export interface ReceiveComponentProps {
  config: TokenFlightReceiveConfig;
  walletAdapter?: IWalletAdapter;
  callbacks?: Callbacks;
}

interface PayTokenQuote {
  token: TokenInfo;
  route: QuoteRoute;
  quoteId: string;
}


export function ReceiveComponent(props: ReceiveComponentProps) {
  const sm = createReceiveStateMachine();
  const [selectedPayIndex, setSelectedPayIndex] = createSignal(0);
  const [selectorOpen, setSelectorOpen] = createSignal(false);
  const [isConnected, setIsConnected] = createSignal(false);
  const [walletAddress, setWalletAddress] = createSignal<string | null>(null);
  const [payTokenQuotes, setPayTokenQuotes] = createSignal<PayTokenQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = createSignal(false);
  const [trackingOrderId, setTrackingOrderId] = createSignal<string | null>(null);
  let quoteAbortController: AbortController | null = null;

  const client = createMemo(() => {
    const endpoint = props.config.apiEndpoint;
    return endpoint ? new KhalaniClient(endpoint) : null;
  });

  // Token balances query (auto-cached, 30s stale)
  const balancesQuery = createTokenBalancesQuery(
    client,
    walletAddress,
    () => isConnected() && !!walletAddress(),
  );

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
    if (order.status === "filled") {
      sm.transition("success");
      const quotes = payTokenQuotes();
      const selected = quotes[selectedPayIndex()];
      props.callbacks?.onSwapSuccess?.({
        orderId: order.id,
        fromToken: selected?.token.symbol ?? "",
        toToken: sm.state().targetToken?.symbol ?? "",
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
    }
  });

  onMount(() => {
    if (props.config.locale) {
      setLocale(props.config.locale);
    }
  });

  // Load chains and resolve target token
  onMount(async () => {
    const c = client();
    if (c) loadChains(c);
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
        setPayTokenQuotes([]);
      });
    }
  });

  // When balances data arrives, fetch quotes for each pay token
  createEffect(() => {
    const data = balancesQuery.data;
    if (data && data.length > 0 && sm.state().targetToken) {
      fetchPayTokenQuotes(data);
    }
  });

  onCleanup(() => {
    quoteAbortController?.abort();
  });

  // Fetch payment token quotes using cached balances
  const fetchPayTokenQuotes = async (balanceTokens: TokenInfo[]) => {
    const c = client();
    const addr = walletAddress();
    const target = sm.state().targetToken;
    if (!c || !addr || !target || !target.decimals || balanceTokens.length === 0) return;

    setLoadingQuotes(true);
    quoteAbortController?.abort();
    const abortController = new AbortController();
    quoteAbortController = abortController;

    try {
      const targetDecimals = target.decimals ?? 18;
      const baseAmount = toBaseUnits(props.config.amount, targetDecimals);

      const quotes: PayTokenQuote[] = [];

      // Get quotes for top balance tokens (limit to prevent too many requests)
      const tokensToQuote = balanceTokens
        .filter((tk) => {
          // Skip the target token itself on the same chain
          if (tk.address.toLowerCase() === target.address.toLowerCase() && tk.chainId === target.chainId) {
            return false;
          }
          // Only include tokens with balance
          return tk.extensions?.balance && tk.extensions.balance !== "0";
        })
        .slice(0, 5);

      for (const payToken of tokensToQuote) {
        if (abortController.signal.aborted) return;
        try {
          const quoteResp = await c.getQuotes({
            tradeType: "EXACT_OUTPUT",
            fromChainId: payToken.chainId,
            fromToken: payToken.address,
            toChainId: target.chainId,
            toToken: target.address,
            amount: baseAmount,
            fromAddress: addr,
          });

          if (quoteResp.routes.length > 0) {
            // Rank and take the best route
            const offers = buildOffersForRanking(quoteResp.routes, "EXACT_OUTPUT");
            const rankedIds = rankOffers(offers);
            const bestRouteId = rankedIds[0];
            const bestRoute = quoteResp.routes.find((r) => r.routeId === bestRouteId) ?? quoteResp.routes[0]!;

            quotes.push({
              token: payToken,
              route: bestRoute,
              quoteId: quoteResp.quoteId,
            });
          }
        } catch {
          // Skip tokens that fail to quote
        }
      }

      if (!abortController.signal.aborted) {
        setPayTokenQuotes(quotes);
        if (quotes.length > 0) {
          sm.transition("quoting");
          sm.transition("quoted");
        }
      }
    } catch {
      // Silent failure
    } finally {
      setLoadingQuotes(false);
    }
  };

  const paymentTokens = createMemo((): PaymentToken[] => {
    const quotes = payTokenQuotes();
    if (quotes.length === 0) return [];

    // Rank all offers to find the best
    const offers = quotes.map((q) => ({
      routeId: q.route.routeId,
      amountIn: BigInt(q.route.quote.amountIn || "0"),
      etaSeconds: q.route.quote.expectedDurationSeconds,
      isGuaranteedOutput: q.route.exactOutMethod === "native",
      isOneClick: q.route.tags?.includes("1-click") ?? false,
    }));
    const rankedIds = rankOffers(offers);
    const bestRouteId = rankedIds[0];

    return quotes.map((q) => {
      const chainInfo = getChainDisplay(q.token.chainId);
      const payDecimals = q.token.decimals;
      const amountIn = formatDisplayAmount(toDisplayAmount(q.route.quote.amountIn, payDecimals), 4);
      const balance = q.token.extensions?.balance
        ? formatDisplayAmount(toDisplayAmount(q.token.extensions.balance, payDecimals), 4)
        : "0";

      // Check if user has enough balance
      const balanceRaw = BigInt(q.token.extensions?.balance ?? "0");
      const amountInRaw = BigInt(q.route.quote.amountIn || "0");
      const hasEnough = balanceRaw >= amountInRaw;

      return {
        symbol: q.token.symbol,
        chain: chainInfo?.name ?? `Chain ${q.token.chainId}`,
        color: "#888",
        amount: amountIn,
        fee: q.route.quote.estimatedGas ?? "0",
        balance,
        best: q.route.routeId === bestRouteId,
        disabled: !hasEnough,
        logoURI: q.token.logoURI,
        chainId: q.token.chainId,
      };
    });
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
    const quotes = payTokenQuotes();
    const selected = quotes[selectedPayIndex()];
    if (!selected || !client() || !props.walletAdapter) return;

    sm.transition("building");
    try {
      const depositData = await client()!.depositBuild({
        from: walletAddress()!,
        quoteId: selected.quoteId,
        routeId: selected.route.routeId,
      });

      sm.transition("awaiting-wallet");

      let txHash: string | undefined;
      if (depositData.kind === "CONTRACT_CALL" && depositData.approvals) {
        for (const approval of depositData.approvals) {
          if (approval.type === "eip1193_request") {
            const result = await props.walletAdapter.executeWalletAction({
              type: "eip1193_request",
              chainId: selected.token.chainId,
              method: approval.request.method,
              params: approval.request.params,
            });
            if (!result.success) {
              throw new TokenFlightError(ErrorCode.WALLET_ACTION_FAILED, result.error ?? "Wallet action failed");
            }
            if (approval.deposit) txHash = result.txHash ?? txHash;
          } else if (approval.type === "solana_sendTransaction") {
            const result = await props.walletAdapter.executeWalletAction({
              type: "solana_signAndSendTransaction",
              transaction: approval.transaction,
            });
            if (!result.success) {
              throw new TokenFlightError(ErrorCode.WALLET_ACTION_FAILED, result.error ?? "Wallet action failed");
            }
            if (approval.deposit) txHash = result.txHash ?? txHash;
          }
        }
      }

      if (!txHash) {
        throw new TokenFlightError(ErrorCode.TRANSACTION_FAILED, "No deposit transaction hash received");
      }

      sm.transition("submitting");

      const submitResult = await client()!.submitDeposit({
        quoteId: selected.quoteId,
        routeId: selected.route.routeId,
        txHash,
      });

      sm.transition("tracking");
      setTrackingOrderId(submitResult.orderId);
    } catch (err) {
      if (err instanceof TokenFlightError) {
        sm.setError(err.message, err.code);
        props.callbacks?.onSwapError?.({ code: err.code, message: err.message, details: err.details });
      } else {
        sm.setError(String(err));
        props.callbacks?.onSwapError?.({ code: ErrorCode.TRANSACTION_FAILED, message: String(err) });
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
          <TokenIcon symbol={targetSymbol()} color="#0052FF" size={32} logoURI={state().targetToken?.logoURI} />
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

      <Show when={!loadingQuotes()} fallback={
        <div style={{ padding: "20px", "text-align": "center", color: "var(--tf-text-tertiary)", "font-size": "13px" }}>
          Loading payment options...
        </div>
      }>
        <PaymentTokenList
          tokens={paymentTokens()}
          selectedIndex={state().phase === "success" ? -1 : selectedPayIndex()}
          onSelect={setSelectedPayIndex}
          onBrowseAll={() => setSelectorOpen(true)}
          apiEndpoint={props.config.apiEndpoint}
        />
      </Show>

      {/* CTA */}
      <div class="tf-cta-wrapper--receive">
        <ActionButton
          phase={state().phase}
          isConnected={isConnected()}
          hasQuote={payTokenQuotes().length > 0}
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
        <Show when={state().phase === "success" && state().order?.depositTxHash}>
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
            client={client()}
            selectingFor="from"
            onSelect={() => {
              setSelectorOpen(false);
            }}
            onClose={() => setSelectorOpen(false)}
          />
        </div>
      </Show>
    </div>
  );
}
