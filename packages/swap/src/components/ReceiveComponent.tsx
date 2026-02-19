import { createSignal, Show, onMount, onCleanup, createMemo, createEffect } from "solid-js";
import { AirplaneLogo, TokenIcon, PoweredByKhalani } from "./icons";
import { ActionButton } from "./ActionButton";
import { TransactionComplete } from "./TransactionComplete";
import { PaymentTokenList, type PaymentToken } from "./PaymentTokenList";
import { TokenSelector, type TokenItem } from "./TokenSelector";
import { createReceiveStateMachine } from "../state/state-machine";
import { HyperstreamApi, DEFAULT_API_ENDPOINT } from "../api/hyperstream-api";
import { parseTokenIdentifier } from "../helpers/caip10";
import { resolveToken } from "../services/token-resolver";
import { toBaseUnits, toDisplayAmount, formatDisplayAmount } from "../helpers/amount-utils";
import { formatNativeFeeDisplay } from "../helpers/native-fee";
import { buildOffersForRanking, rankOffers } from "../services/rank-offers";
import { loadChains, getChainDisplay } from "../services/chain-registry";
import { createTokenBalancesQuery, createOrderQuery } from "../queries/queries";
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
    const endpoint = props.config.apiEndpoint ?? DEFAULT_API_ENDPOINT;
    return new HyperstreamApi({ baseUrl: endpoint });
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
      const resolved = await resolveToken(target.chainId, target.address, props.config.apiEndpoint, c);
      if (!resolved.decimals) {
        sm.setError("Failed to resolve target token metadata", ErrorCode.INVALID_CONFIG);
        return;
      }
      sm.setTargetToken(resolved);
      sm.setTargetAmount(props.config.amount);
    } catch (err) {
      sm.setError(
        err instanceof Error ? err.message : "Failed to resolve target token",
        ErrorCode.INVALID_CONFIG,
      );
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
        const chainType = props.walletAdapter!.supportedActionTypes.some(
          (t) => t.startsWith("solana_"),
        ) ? "solana" as const : "evm" as const;
        props.callbacks?.onWalletConnected?.({ address: addr ?? "", chainType });
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

  // Fetch a single payment token quote and return it (or null on failure)
  const fetchSingleQuote = async (
    c: HyperstreamApi,
    payToken: TokenInfo,
    baseAmount: string,
    addr: string,
    target: { chainId: number; address: string },
    signal: AbortSignal,
  ): Promise<PayTokenQuote | null> => {
    if (signal.aborted) return null;
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
        const offers = buildOffersForRanking(quoteResp.routes, "EXACT_OUTPUT");
        const rankedIds = rankOffers(offers);
        const bestRouteId = rankedIds[0];
        const bestRoute = quoteResp.routes.find((r) => r.routeId === bestRouteId) ?? quoteResp.routes[0]!;

        return {
          token: payToken,
          route: bestRoute,
          quoteId: quoteResp.quoteId,
        };
      }
    } catch {
      // Skip tokens that fail to quote
    }
    return null;
  };

  // Fetch payment token quotes using cached balances
  const fetchPayTokenQuotes = async (balanceTokens: TokenInfo[]) => {
    const c = client();
    const addr = walletAddress();
    const target = sm.state().targetToken;
    if (!c || !addr || !target || !target.decimals || balanceTokens.length === 0) return;

    // Transition to quoting at the START of fetching
    const phase = sm.state().phase;
    if (phase === "idle" || phase === "quoted" || phase === "error") {
      if (phase === "error") sm.transition("idle");
      sm.transition("quoting");
    }

    setLoadingQuotes(true);
    quoteAbortController?.abort();
    const abortController = new AbortController();
    quoteAbortController = abortController;

    try {
      const baseAmount = toBaseUnits(props.config.amount, target.decimals);

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
        const quote = await fetchSingleQuote(c, payToken, baseAmount, addr, target, abortController.signal);
        if (quote) quotes.push(quote);
      }

      if (!abortController.signal.aborted) {
        setPayTokenQuotes(quotes);
        if (quotes.length > 0) {
          sm.transition("quoted");
        } else {
          // No routes found — go back to idle
          sm.transition("idle");
        }
      }
    } catch {
      if (!abortController.signal.aborted) {
        sm.transition("idle");
      }
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
      const fee = formatNativeFeeDisplay(q.route.quote.estimatedGas, q.token.chainId);

      return {
        symbol: q.token.symbol,
        chain: chainInfo?.name ?? `Chain ${q.token.chainId}`,
        color: "#888",
        amount: amountIn,
        feeAmount: fee.amount,
        feeSymbol: fee.symbol,
        balance,
        best: q.route.routeId === bestRouteId,
        disabled: !hasEnough,
        logoURI: q.token.logoURI,
        chainId: q.token.chainId,
      };
    });
  });

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

  // Handle token selection from the "Browse all" TokenSelector
  const handleTokenSelect = async (token: TokenItem) => {
    setSelectorOpen(false);

    const c = client();
    const addr = walletAddress();
    const target = sm.state().targetToken;
    if (!c || !addr || !target || !target.decimals || !token.address || !token.decimals) return;

    setLoadingQuotes(true);
    try {
      const baseAmount = toBaseUnits(props.config.amount, target.decimals);
      const payToken: TokenInfo = {
        address: token.address,
        chainId: token.chainId,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoURI: token.logoURI,
        extensions: token.balance !== "0" ? { balance: toBaseUnits(token.balance, token.decimals) } : undefined,
      };

      const abortController = new AbortController();
      const quote = await fetchSingleQuote(c, payToken, baseAmount, addr, target, abortController.signal);
      if (quote) {
        const existing = payTokenQuotes();
        // Replace if same token already exists, otherwise append
        const idx = existing.findIndex(
          (q) => q.token.address.toLowerCase() === token.address!.toLowerCase() && q.token.chainId === token.chainId,
        );
        let updated: PayTokenQuote[];
        if (idx >= 0) {
          updated = [...existing];
          updated[idx] = quote;
        } else {
          updated = [...existing, quote];
        }
        setPayTokenQuotes(updated);
        // Select the newly added/updated token
        const newIdx = idx >= 0 ? idx : updated.length - 1;
        setSelectedPayIndex(newIdx);

        if (sm.state().phase === "idle" || sm.state().phase === "quoting") {
          if (sm.state().phase === "idle") sm.transition("quoting");
          sm.transition("quoted");
        }
      }
    } catch {
      // Failed to get quote for selected token
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleConfirm = async () => {
    const quotes = payTokenQuotes();
    const selected = quotes[selectedPayIndex()];
    const addr = walletAddress();
    if (!selected || !client() || !props.walletAdapter || !addr) return;

    // Check if quote has expired
    const validBefore = selected.route.quote.validBefore;
    if (validBefore && Date.now() / 1000 > validBefore) {
      // Quote expired — re-fetch for this specific token
      setLoadingQuotes(true);
      try {
        const target = sm.state().targetToken;
        if (!target?.decimals) return;
        const baseAmount = toBaseUnits(props.config.amount, target.decimals);
        const abortController = new AbortController();
        const refreshed = await fetchSingleQuote(
          client()!, selected.token, baseAmount, addr, target, abortController.signal,
        );
        if (refreshed) {
          const updated = [...quotes];
          updated[selectedPayIndex()] = refreshed;
          setPayTokenQuotes(updated);
          // Continue with refreshed quote below
        } else {
          sm.setError("Quote expired and could not be refreshed", ErrorCode.QUOTE_EXPIRED);
          return;
        }
      } catch {
        sm.setError("Quote expired and could not be refreshed", ErrorCode.QUOTE_EXPIRED);
        return;
      } finally {
        setLoadingQuotes(false);
      }
    }

    // Re-read in case we refreshed
    const confirmedQuote = payTokenQuotes()[selectedPayIndex()];
    if (!confirmedQuote) return;

    // Set fromToken so TransactionComplete can display it
    sm.setFromToken({
      chainId: confirmedQuote.token.chainId,
      address: confirmedQuote.token.address,
      symbol: confirmedQuote.token.symbol,
      name: confirmedQuote.token.name,
      decimals: confirmedQuote.token.decimals,
      logoURI: confirmedQuote.token.logoURI,
    });

    sm.transition("building");
    try {
      const depositData = await client()!.buildDeposit({
        from: addr,
        quoteId: confirmedQuote.quoteId,
        routeId: confirmedQuote.route.routeId,
      });

      sm.transition("awaiting-wallet");

      let txHash: string | undefined;
      if (depositData.kind === "CONTRACT_CALL" && depositData.approvals) {
        for (const approval of depositData.approvals) {
          if (approval.type === "eip1193_request") {
            const result = await props.walletAdapter.executeWalletAction({
              type: "eip1193_request",
              chainId: confirmedQuote.token.chainId,
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
        quoteId: confirmedQuote.quoteId,
        routeId: confirmedQuote.route.routeId,
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
    // Re-fetch quotes if we have balance data available
    const data = balancesQuery.data;
    if (data && data.length > 0 && sm.state().targetToken) {
      fetchPayTokenQuotes(data);
    }
  };

  const handleNewSwap = () => {
    sm.clearRoutes();
    sm.setPaymentAmount("");
    sm.setFromToken(null);
    setSelectedPayIndex(0);
    setTrackingOrderId(null);
    setPayTokenQuotes([]);
    sm.transition("idle");
    // Re-fetch quotes if balance data is cached
    const data = balancesQuery.data;
    if (data && data.length > 0 && sm.state().targetToken) {
      fetchPayTokenQuotes(data);
    }
  };

  const state = () => sm.state();
  const isExecuting = () => {
    const p = state().phase;
    return p === "building" || p === "awaiting-wallet" || p === "submitting" || p === "tracking";
  };
  const targetSymbol = () => state().targetToken?.symbol ?? "USDC";
  const targetAmount = () => state().targetAmount || props.config.amount;
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

  return (
    <div class={`tf-container${props.config.noBackground ? " tf-container--no-bg" : ""}${props.config.noBorder ? " tf-container--no-border" : ""}`} part="container">
      <div class="tf-accent-line" />

      <Show when={state().phase === "success" && state().order} fallback={
        <>
          {/* Header (no wallet status) */}
          <div class="tf-receive-header" part="header">
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
            <div class="tf-pay-token-list" aria-hidden="true">
              <div class="tf-pay-token tf-pay-token--skeleton">
                <div class="tf-pay-token-left">
                  <div class="tf-skeleton" style={{ width: "30px", height: "30px", "border-radius": "50%" }} />
                  <div class="tf-pay-token-info">
                    <div class="tf-pay-token-top-row">
                      <div class="tf-skeleton" style={{ width: "64px", height: "12px" }} />
                      <div class="tf-skeleton" style={{ width: "52px", height: "14px", "border-radius": "7px" }} />
                    </div>
                    <div class="tf-skeleton" style={{ width: "88px", height: "10px", "margin-top": "4px" }} />
                  </div>
                </div>
                <div class="tf-pay-token-right">
                  <div class="tf-skeleton" style={{ width: "58px", height: "12px" }} />
                  <div class="tf-skeleton" style={{ width: "74px", height: "10px", "margin-top": "4px" }} />
                </div>
              </div>
              <div class="tf-pay-token tf-pay-token--skeleton">
                <div class="tf-pay-token-left">
                  <div class="tf-skeleton" style={{ width: "30px", height: "30px", "border-radius": "50%" }} />
                  <div class="tf-pay-token-info">
                    <div class="tf-pay-token-top-row">
                      <div class="tf-skeleton" style={{ width: "56px", height: "12px" }} />
                      <div class="tf-skeleton" style={{ width: "48px", height: "14px", "border-radius": "7px" }} />
                    </div>
                    <div class="tf-skeleton" style={{ width: "82px", height: "10px", "margin-top": "4px" }} />
                  </div>
                </div>
                <div class="tf-pay-token-right">
                  <div class="tf-skeleton" style={{ width: "52px", height: "12px" }} />
                  <div class="tf-skeleton" style={{ width: "68px", height: "10px", "margin-top": "4px" }} />
                </div>
              </div>
              <div class="tf-pay-token tf-pay-token--skeleton">
                <div class="tf-pay-token-left">
                  <div class="tf-skeleton" style={{ width: "30px", height: "30px", "border-radius": "50%" }} />
                  <div class="tf-pay-token-info">
                    <div class="tf-pay-token-top-row">
                      <div class="tf-skeleton" style={{ width: "60px", height: "12px" }} />
                      <div class="tf-skeleton" style={{ width: "50px", height: "14px", "border-radius": "7px" }} />
                    </div>
                    <div class="tf-skeleton" style={{ width: "84px", height: "10px", "margin-top": "4px" }} />
                  </div>
                </div>
                <div class="tf-pay-token-right">
                  <div class="tf-skeleton" style={{ width: "54px", height: "12px" }} />
                  <div class="tf-skeleton" style={{ width: "70px", height: "10px", "margin-top": "4px" }} />
                </div>
              </div>
            </div>
          }>
            <PaymentTokenList
              tokens={paymentTokens()}
              selectedIndex={selectedPayIndex()}
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
                isExecuting()
                  ? undefined
                  : t("receive.buy", { amount: targetAmount(), symbol: targetSymbol() })
              }
            />
          </div>
        </>
      }>
        <TransactionComplete
          order={state().order!}
          fromToken={state().fromToken}
          toToken={state().targetToken}
          onNewSwap={handleNewSwap}
        />
      </Show>

      <Show when={!props.config.hidePoweredBy}>
        <PoweredByKhalani />
      </Show>

      {/* Token Selector */}
      <Show when={selectorOpen()}>
        <div class="tf-selector-overlay">
          <TokenSelector
            client={client()}
            walletAddress={walletAddress()}
            selectingFor="from"
            onSelect={handleTokenSelect}
            onClose={() => setSelectorOpen(false)}
          />
        </div>
      </Show>
    </div>
  );
}
