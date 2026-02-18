import { createSignal, batch } from "solid-js";
import type { SwapPhase, SwapState, ReceiveState } from "../types/state";
import type { QuoteResponse, OrderResponse, ResolvedToken } from "../types/api";

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
    quote: null,
    selectedRouteId: null,
    order: null,
    walletAddress: null,
    error: null,
    errorCode: null,
  });

  function transition(nextPhase: SwapPhase) {
    const current = state().phase;
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed?.includes(nextPhase)) {
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

  function setQuote(quote: QuoteResponse | null) {
    batch(() => {
      setState((prev) => ({
        ...prev,
        quote,
        outputAmount: quote?.toAmount ?? "",
        selectedRouteId: quote?.routes[0]?.routeId ?? null,
      }));
    });
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
      quote: null,
      selectedRouteId: null,
      order: null,
      walletAddress: state().walletAddress,
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
    setQuote,
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
    quote: null,
    selectedRouteId: null,
    order: null,
    walletAddress: null,
    error: null,
    errorCode: null,
  });

  function transition(nextPhase: SwapPhase) {
    const current = state().phase;
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed?.includes(nextPhase)) {
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

  function setQuote(quote: QuoteResponse | null) {
    batch(() => {
      setState((prev) => ({
        ...prev,
        quote,
        paymentAmount: quote?.fromAmount ?? "",
        selectedRouteId: quote?.routes[0]?.routeId ?? null,
      }));
    });
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
      quote: null,
      selectedRouteId: null,
      order: null,
      error: null,
      errorCode: null,
      paymentAmount: "",
    }));
  }

  return {
    state,
    transition,
    setTargetToken,
    setFromToken,
    setTargetAmount,
    setPaymentAmount,
    setQuote,
    setOrder,
    setWalletAddress,
    setError,
    reset,
  };
}
