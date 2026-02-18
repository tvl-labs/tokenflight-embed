/** Token info from Hyperstream API */
export interface TokenInfo {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  platform?: string;
  id?: string;
  extensions?: TokenExtensions;
}

/** Token extensions with balance and price data */
export interface TokenExtensions {
  balance?: string;
  isRiskToken?: boolean;
  price?: { usd: string };
  change?: string;
  volume?: string;
  marketCap?: string;
  liquidity?: string;
  spokeToken?: TokenInfo;
}

/** Chain info from Hyperstream API */
export interface ChainInfo {
  [key: string]: unknown;
  type?: string;
}

/** Resolved token with full metadata for local display state */
export interface ResolvedToken {
  chainId: number;
  address: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
}

/** Trade type for quote requests */
export type TradeType = "EXACT_INPUT" | "EXACT_OUTPUT";

/** Exact output method for providers */
export type ExactOutMethod = "native" | "adaptive";

/** Route tags */
export type RouteTag = "1-click" | "needs-approval";

/** Quote request parameters (POST /v1/quotes) */
export interface QuoteRequest {
  tradeType: TradeType;
  fromChainId: number;
  fromToken: string;
  toChainId: number;
  toToken: string;
  amount: string;
  fromAddress: string;
  recipient?: string;
  slippageTolerance?: number;
}

/** Quote data within a route */
export interface RouteQuote {
  amountIn: string;
  amountOut: string;
  minAmountOut?: string;
  slippageTolerance?: number;
  expectedDurationSeconds: number;
  validBefore: number;
  estimatedGas?: string;
  tags?: RouteTag[];
}

/** Route within a quote response */
export interface QuoteRoute {
  routeId: string;
  type: string;
  icon?: string;
  exactOutMethod?: ExactOutMethod;
  tags?: RouteTag[];
  quote: RouteQuote;
}

/** Non-streaming quote response */
export interface QuoteResponse {
  quoteId: string;
  routes: QuoteRoute[];
}

/** Streaming route (each NDJSON line) */
export interface StreamingRoute extends QuoteRoute {
  quoteId: string;
}

/** Token search response */
export interface TokenSearchResponse {
  data: TokenInfo[];
}

/** Token list response (paginated) */
export interface TokenListResponse {
  data: TokenInfo[];
  cursor?: number;
}

// --- Deposit Build Types ---

/** EVM EIP-1193 approval request */
export interface EIP1193RequestApproval {
  type: "eip1193_request";
  request: {
    method: string;
    params: unknown[];
  };
  waitForReceipt?: boolean;
  deposit?: boolean;
}

/** Solana send transaction approval */
export interface SolanaApproval {
  type: "solana_sendTransaction";
  transaction: string;
  deposit?: boolean;
}

/** Approval union */
export type DepositApproval = EIP1193RequestApproval | SolanaApproval;

/** CONTRACT_CALL deposit (most common) */
export interface ContractCallDeposit {
  kind: "CONTRACT_CALL";
  approvals?: DepositApproval[];
}

/** Deposit build response - currently only CONTRACT_CALL is supported */
export type DepositBuildResponse = ContractCallDeposit;

// --- Submit Types ---

/** Submit deposit response */
export interface SubmitDepositResponse {
  orderId: string;
  txHash: string;
}

// --- Order Types ---

/** Order status aligned with backend state machine */
export type OrderStatus =
  | "created"
  | "deposited"
  | "published"
  | "filled"
  | "refund_pending"
  | "refunded"
  | "failed";

/** Terminal order statuses */
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = ["filled", "refunded", "failed"];

/** On-chain transaction details */
export interface OnChainTx {
  timestamp: string;
  txHash: string;
  chainId: number;
  amount?: string;
}

/** Order transactions */
export interface OrderTransactions {
  deposit?: OnChainTx;
  fill?: OnChainTx;
  refund?: OnChainTx;
}

/** Order timestamps */
export interface OrderTimestamps {
  createdAt: string;
  publishedAt?: string;
  failedAt?: string;
}

/** Token metadata inline in order */
export interface TokenMeta {
  symbol: string;
  decimals: number;
  logoURI: string | null;
}

/** Order response from API */
export interface OrderResponse {
  id: string;
  type: string;
  quoteId: string;
  routeId: string;
  fromChainId: number;
  fromToken: string;
  toChainId: number;
  toToken: string;
  srcAmount: string;
  destAmount: string;
  status: OrderStatus;
  author: string;
  recipient: string | null;
  depositTxHash: string;
  tradeType: string;
  createdAt: string;
  updatedAt: string;
  transactions?: OrderTransactions;
  timestamps?: OrderTimestamps;
  stepsCompleted?: OrderStatus[];
  fromTokenMeta?: TokenMeta | null;
  toTokenMeta?: TokenMeta | null;
}

/** Orders list response (paginated) */
export interface OrderListResponse {
  data: OrderResponse[];
  cursor?: number;
}
