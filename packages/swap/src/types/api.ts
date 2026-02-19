import type { HyperstreamApi } from "../core/hyperstream-api";

// Re-export namespace types under backward-compatible names

export type TokenInfo = HyperstreamApi.Token;
export type TokenExtensions = HyperstreamApi.TokenExtensions;
export type ChainInfo = HyperstreamApi.Chain;
export type TradeType = HyperstreamApi.TradeType;
export type ExactOutMethod = HyperstreamApi.ExactOutMethod;
export type RouteTag = HyperstreamApi.RouteTag;
export type QuoteRequest = HyperstreamApi.QuoteRequest;
export type RouteQuote = HyperstreamApi.Quote;
export type QuoteRoute = HyperstreamApi.Route;
export type QuoteResponse = HyperstreamApi.GetQuotesResponse;
export type StreamingRoute = HyperstreamApi.StreamingRoute;
export type TokenSearchResponse = HyperstreamApi.TokenSearchResponse;
export type TokenListResponse = HyperstreamApi.GetTokensResponse;
export type EIP1193RequestApproval = HyperstreamApi.EIP1193RequestApproval;
export type SolanaApproval = HyperstreamApi.SolanaApproval;
export type DepositApproval = HyperstreamApi.Approval;
export type ContractCallDeposit = HyperstreamApi.ContractCallDeposit;
export type DepositBuildResponse = HyperstreamApi.Deposit;
export type SubmitDepositResponse = HyperstreamApi.SubmitDepositResponse;
export type OrderStatus = HyperstreamApi.OrderStatus;
export type OnChainTx = HyperstreamApi.OnChainTx;
export type OrderTransactions = HyperstreamApi.OrderTransactions;
export type OrderTimestamps = HyperstreamApi.OrderTimestamps;
export type TokenMeta = HyperstreamApi.TokenMeta;
export type OrderResponse = HyperstreamApi.Order;
export type OrderListResponse = HyperstreamApi.GetOrderResponse;

// Local types (not API response types)

/** Resolved token with full metadata for local display state */
export interface ResolvedToken {
  chainId: number;
  address: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
}

/** Terminal order statuses */
export const TERMINAL_ORDER_STATUSES: HyperstreamApi.OrderStatus[] = ["filled", "refunded", "failed"];
