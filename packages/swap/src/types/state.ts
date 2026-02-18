import type { OrderResponse, QuoteRoute, ResolvedToken } from "./api";

/** Swap flow phases */
export type SwapPhase =
  | "idle"
  | "quoting"
  | "quoted"
  | "building"
  | "awaiting-wallet"
  | "submitting"
  | "tracking"
  | "success"
  | "error";

/** State for `<tokenflight-swap>` */
export interface SwapState {
  phase: SwapPhase;
  fromToken: ResolvedToken | null;
  toToken: ResolvedToken | null;
  inputAmount: string;
  outputAmount: string;
  /** Accumulated routes from streaming or non-streaming quotes */
  routes: QuoteRoute[];
  quoteId: string | null;
  selectedRouteId: string | null;
  order: OrderResponse | null;
  walletAddress: string | null;
  isStreaming: boolean;
  error: string | null;
  errorCode: string | null;
}

/** State for `<tokenflight-receive>` */
export interface ReceiveState {
  phase: SwapPhase;
  targetToken: ResolvedToken | null;
  fromToken: ResolvedToken | null;
  targetAmount: string;
  paymentAmount: string;
  /** Accumulated routes from streaming or non-streaming quotes */
  routes: QuoteRoute[];
  quoteId: string | null;
  selectedRouteId: string | null;
  order: OrderResponse | null;
  walletAddress: string | null;
  isStreaming: boolean;
  error: string | null;
  errorCode: string | null;
}
