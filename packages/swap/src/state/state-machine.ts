import { createSignal, batch } from "solid-js";
import type { SwapPhase, SwapState, ReceiveState } from "../types/state";
import type { OrderResponse, QuoteRoute, ResolvedToken } from "../types/api";

const VALID_TRANSITIONS: Record<SwapPhase, SwapPhase[]> = {
  idle: ["quoting"],
  quoting: ["quoted", "error", "idle"],
  quoted: ["building", "quoting", "idle"],
  building: ["awaiting-wallet", "error", "quoted"],
  "awaiting-wallet": ["submitting", "error", "quoted"],
  submitting: ["tracking", "error", "quoted"],
  tracking: ["success", "error"],
  success: ["idle"],
  error: ["idle", "quoting", "quoted"],
};

export function createSwapStateMachine() {
  const [state, setState] = createSignal<SwapState>({
    phase: "idle",
    fromToken: null,
    toToken: null,
    inputAmount: "",
    outputAmount: "",
    routes: [],
    quoteId: null,
    selectedRouteId: null,
    order: null,
    walletAddress: null,
    isStreaming: false,
    error: null,
    errorCode: null,
  });

  function transition(nextPhase: SwapPhase): boolean {
    const current = state().phase;
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed?.includes(nextPhase)) {
      console.warn(`[TokenFlight] Invalid state transition: ${current} → ${nextPhase}`);
      return false;
    }
    setState((prev) => ({ ...prev, phase: nextPhase }));
    return true;
  }

  function setFromToken(token: ResolvedToken | null) {
    setState((prev) => ({ ...prev, fromToken: token }));
  }

  function setToToken(token: ResolvedToken | null) {
    setState((prev) => ({ ...prev, toToken: token }));
  }

  function setInputAmount(amount: string) {
    setState((prev) => ({ ...prev, inputAmount: amount }));
  }

  function setOutputAmount(amount: string) {
    setState((prev) => ({ ...prev, outputAmount: amount }));
  }

  /** Set routes and quoteId from a non-streaming quote response. */
  function setQuoteData(quoteId: string, routes: QuoteRoute[], selectedRouteId: string | null) {
    batch(() => {
      setState((prev) => ({
        ...prev,
        quoteId,
        routes,
        selectedRouteId,
      }));
    });
  }

  /** Add a single route from streaming. */
  function addStreamingRoute(quoteId: string, route: QuoteRoute) {
    setState((prev) => ({
      ...prev,
      quoteId,
      routes: [...prev.routes, route],
    }));
  }

  /** Clear routes (e.g., before a new quote request). */
  function clearRoutes() {
    setState((prev) => ({
      ...prev,
      routes: [],
      quoteId: null,
      selectedRouteId: null,
    }));
  }

  function setSelectedRouteId(routeId: string | null) {
    setState((prev) => ({ ...prev, selectedRouteId: routeId }));
  }

  function setStreaming(isStreaming: boolean) {
    setState((prev) => ({ ...prev, isStreaming }));
  }

  function setOrder(order: OrderResponse | null) {
    setState((prev) => ({ ...prev, order }));
  }

  function setWalletAddress(address: string | null) {
    setState((prev) => ({ ...prev, walletAddress: address }));
  }

  function setError(error: string | null, errorCode: string | null = null) {
    setState((prev) => ({ ...prev, error, errorCode, phase: "error" }));
  }

  function reset() {
    setState({
      phase: "idle",
      fromToken: state().fromToken,
      toToken: state().toToken,
      inputAmount: "",
      outputAmount: "",
      routes: [],
      quoteId: null,
      selectedRouteId: null,
      order: null,
      walletAddress: state().walletAddress,
      isStreaming: false,
      error: null,
      errorCode: null,
    });
  }

  return {
    state,
    transition,
    setFromToken,
    setToToken,
    setInputAmount,
    setOutputAmount,
    setQuoteData,
    addStreamingRoute,
    clearRoutes,
    setSelectedRouteId,
    setStreaming,
    setOrder,
    setWalletAddress,
    setError,
    reset,
  };
}

export function createReceiveStateMachine() {
  const [state, setState] = createSignal<ReceiveState>({
    phase: "idle",
    targetToken: null,
    fromToken: null,
    targetAmount: "",
    paymentAmount: "",
    routes: [],
    quoteId: null,
    selectedRouteId: null,
    order: null,
    walletAddress: null,
    isStreaming: false,
    error: null,
    errorCode: null,
  });

  function transition(nextPhase: SwapPhase): boolean {
    const current = state().phase;
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed?.includes(nextPhase)) {
      console.warn(`[TokenFlight] Invalid state transition: ${current} → ${nextPhase}`);
      return false;
    }
    setState((prev) => ({ ...prev, phase: nextPhase }));
    return true;
  }

  function setTargetToken(token: ResolvedToken | null) {
    setState((prev) => ({ ...prev, targetToken: token }));
  }

  function setFromToken(token: ResolvedToken | null) {
    setState((prev) => ({ ...prev, fromToken: token }));
  }

  function setTargetAmount(amount: string) {
    setState((prev) => ({ ...prev, targetAmount: amount }));
  }

  function setPaymentAmount(amount: string) {
    setState((prev) => ({ ...prev, paymentAmount: amount }));
  }

  function setQuoteData(quoteId: string, routes: QuoteRoute[], selectedRouteId: string | null) {
    batch(() => {
      setState((prev) => ({
        ...prev,
        quoteId,
        routes,
        selectedRouteId,
      }));
    });
  }

  function addStreamingRoute(quoteId: string, route: QuoteRoute) {
    setState((prev) => ({
      ...prev,
      quoteId,
      routes: [...prev.routes, route],
    }));
  }

  function clearRoutes() {
    setState((prev) => ({
      ...prev,
      routes: [],
      quoteId: null,
      selectedRouteId: null,
    }));
  }

  function setSelectedRouteId(routeId: string | null) {
    setState((prev) => ({ ...prev, selectedRouteId: routeId }));
  }

  function setStreaming(isStreaming: boolean) {
    setState((prev) => ({ ...prev, isStreaming }));
  }

  function setOrder(order: OrderResponse | null) {
    setState((prev) => ({ ...prev, order }));
  }

  function setWalletAddress(address: string | null) {
    setState((prev) => ({ ...prev, walletAddress: address }));
  }

  function setError(error: string | null, errorCode: string | null = null) {
    setState((prev) => ({ ...prev, error, errorCode, phase: "error" }));
  }

  function reset() {
    setState((prev) => ({
      ...prev,
      phase: "idle" as SwapPhase,
      routes: [],
      quoteId: null,
      selectedRouteId: null,
      order: null,
      error: null,
      errorCode: null,
      paymentAmount: "",
      isStreaming: false,
    }));
  }

  return {
    state,
    transition,
    setTargetToken,
    setFromToken,
    setTargetAmount,
    setPaymentAmount,
    setQuoteData,
    addStreamingRoute,
    clearRoutes,
    setSelectedRouteId,
    setStreaming,
    setOrder,
    setWalletAddress,
    setError,
    reset,
  };
}
