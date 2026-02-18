import type { WalletActionType } from "./wallet";

/** Token info from Khalani API */
export interface TokenInfo {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

/** Chain info from Khalani API */
export interface ChainInfo {
  chainId: number;
  name: string;
  chainType: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl?: string;
}

/** Resolved token with full metadata */
export interface ResolvedToken {
  chainId: number;
  address: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
}

/** Quote request parameters */
export interface QuoteRequest {
  fromChainId: number;
  fromTokenAddress: string;
  toChainId: number;
  toTokenAddress: string;
  amount: string;
  slippage?: number;
  senderAddress?: string;
}

/** Descriptor for wallet actions required by a route */
export interface WalletActionDescriptor {
  type: WalletActionType | string;
  chainId?: number;
  description?: string;
}

/** Route within a quote */
export interface QuoteRoute {
  routeId: string;
  provider: string;
  estimatedOutput: string;
  estimatedFee: string;
  estimatedTime: number;
  actions: WalletActionDescriptor[];
}

/** Quote response from API */
export interface QuoteResponse {
  quoteId: string;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string;
  estimatedFee: string;
  estimatedTime: number;
  routes: QuoteRoute[];
}

/** Route information from quote */
export interface RouteInfo {
  routeId: string;
  provider: string;
  estimatedOutput: string;
  estimatedFee: string;
  estimatedTime: number;
}

/** Quote result data */
export interface QuoteResult {
  quoteId: string;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string;
  estimatedFee: string;
  estimatedTime: number;
  routes: RouteInfo[];
}

/** Order status */
export type OrderStatus =
  | "pending"
  | "processing"
  | "bridging"
  | "completing"
  | "completed"
  | "failed"
  | "refunded";

/** Order response */
export interface OrderResponse {
  orderId: string;
  status: OrderStatus;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  txHash?: string;
  destinationTxHash?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}
