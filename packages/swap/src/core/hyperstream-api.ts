import ky, { type KyInstance, TimeoutError, HTTPError } from "ky";
import { ErrorCode, TokenFlightError } from "../types/errors";

const DEFAULT_TIMEOUT = 15000;
const STREAM_TIMEOUT = 30000;

export class HyperstreamApi {
  readonly baseUrl: string;
  private readonly ky: KyInstance;

  constructor(options: { baseUrl: string }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.ky = ky.create({
      prefixUrl: this.baseUrl,
      timeout: DEFAULT_TIMEOUT,
      retry: 0,
    });
  }

  private async request<T>(promise: Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (err) {
      if (err instanceof TokenFlightError) throw err;

      if (err instanceof TimeoutError) {
        throw new TokenFlightError(
          ErrorCode.API_TIMEOUT,
          `API request timed out`,
          err,
        );
      }

      if (err instanceof HTTPError) {
        const errorBody = await err.response.text().catch(() => "");
        throw new TokenFlightError(
          ErrorCode.API_REQUEST_FAILED,
          `API request failed: ${err.response.status} ${err.response.statusText}`,
          { status: err.response.status, body: errorBody },
        );
      }

      throw new TokenFlightError(
        ErrorCode.API_REQUEST_FAILED,
        `API request failed: ${String(err)}`,
        err,
      );
    }
  }

  // --- Quotes ---

  getQuotes(request: HyperstreamApi.QuoteRequest): Promise<HyperstreamApi.GetQuotesResponse> {
    return this.request(
      this.ky.post("v1/quotes", { json: request }).json<HyperstreamApi.GetQuotesResponse>(),
    );
  }

  async getQuotesStream(
    request: HyperstreamApi.QuoteRequest,
    onRoute: (route: HyperstreamApi.StreamingRoute) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await this.request(
      this.ky.post("v1/quotes", {
        json: request,
        searchParams: { mode: "stream" },
        headers: { Accept: "application/x-ndjson" },
        signal: signal ?? AbortSignal.timeout(STREAM_TIMEOUT),
        timeout: false,
      }),
    );

    const body = response.body;
    if (!body) {
      throw new TokenFlightError(
        ErrorCode.API_INVALID_RESPONSE,
        "No response body from streaming quotes endpoint",
      );
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            try {
              onRoute(JSON.parse(buffer.trim()) as HyperstreamApi.StreamingRoute);
            } catch {
              // Ignore malformed final chunk
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            onRoute(JSON.parse(trimmed) as HyperstreamApi.StreamingRoute);
          } catch {
            // Skip malformed lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // --- Deposit ---

  buildDeposit(params: {
    from: string;
    quoteId: string;
    routeId: string;
  }): Promise<HyperstreamApi.Deposit> {
    return this.request(
      this.ky.post("v1/deposit/build", { json: params }).json<HyperstreamApi.Deposit>(),
    );
  }

  submitDeposit(
    params: { quoteId: string; routeId: string } & (
      | { txHash: string }
      | { signedTransaction: string }
    ),
  ): Promise<HyperstreamApi.SubmitDepositResponse> {
    return this.request(
      this.ky.put("v1/deposit/submit", { json: params }).json<HyperstreamApi.SubmitDepositResponse>(),
    );
  }

  // --- Orders ---

  getOrdersByAddress(
    address: string,
    options?: {
      orderIds?: string[];
      limit?: number;
      cursor?: number;
    },
  ): Promise<HyperstreamApi.GetOrderResponse> {
    const searchParams = new URLSearchParams();
    if (options?.orderIds?.length) searchParams.set("orderIds", options.orderIds.join(","));
    if (options?.limit) searchParams.set("limit", options.limit.toString());
    if (options?.cursor) searchParams.set("cursor", options.cursor.toString());

    const qs = searchParams.toString();
    return this.request(
      this.ky
        .get(`v1/orders/${encodeURIComponent(address)}${qs ? `?${qs}` : ""}`)
        .json<HyperstreamApi.GetOrderResponse>(),
    );
  }

  async getOrderById(address: string, orderId: string): Promise<HyperstreamApi.Order | null> {
    const result = await this.getOrdersByAddress(address, { orderIds: [orderId] });
    return result.data[0] ?? null;
  }

  // --- Tokens ---

  getTokens(params?: {
    q?: string;
    chainIds?: number[];
    limit?: number;
    cursor?: number;
  }): Promise<HyperstreamApi.GetTokensResponse> {
    const searchParams: Record<string, string> = {};
    if (params?.q) searchParams.q = params.q;
    if (params?.chainIds?.length) searchParams.chainIds = params.chainIds.join(",");
    if (params?.limit) searchParams.limit = params.limit.toString();
    if (params?.cursor) searchParams.cursor = params.cursor.toString();

    return this.request(
      this.ky.get("v1/tokens", { searchParams }).json<HyperstreamApi.GetTokensResponse>(),
    );
  }

  searchTokens(
    query: string,
    options?: { chainIds?: number[] },
  ): Promise<HyperstreamApi.TokenSearchResponse> {
    const searchParams: Record<string, string> = { q: query };
    if (options?.chainIds?.length) searchParams.chainIds = options.chainIds.join(",");

    return this.request(
      this.ky.get("v1/tokens/search", { searchParams }).json<HyperstreamApi.TokenSearchResponse>(),
    );
  }

  getTopTokens(params?: {
    chainIds?: number[];
  }): Promise<HyperstreamApi.Token[]> {
    const searchParams: Record<string, string> = {};
    if (params?.chainIds?.length) searchParams.chainIds = params.chainIds.join(",");

    return this.request(
      this.ky.get("v1/tokens/top", { searchParams }).json<HyperstreamApi.Token[]>(),
    );
  }

  getTokenBalances(
    address: string,
    options?: { chainIds?: number[] },
  ): Promise<HyperstreamApi.Token[]> {
    const searchParams: Record<string, string> = {};
    if (options?.chainIds?.length) searchParams.chainIds = options.chainIds.join(",");

    return this.request(
      this.ky
        .get(`v1/tokens/balances/${encodeURIComponent(address)}`, { searchParams })
        .json<HyperstreamApi.Token[]>(),
    );
  }

  // --- Chains ---

  getChains(): Promise<HyperstreamApi.Chain[]> {
    return this.request(this.ky.get("v1/chains").json<HyperstreamApi.Chain[]>());
  }
}

// Declaration-merged namespace: co-locates all API types with the class
export namespace HyperstreamApi {
  // --- Token Types ---

  export interface TokenExtensions {
    balance?: string;
    isRiskToken?: boolean;
    price?: { usd: string };
    change?: string;
    volume?: string;
    marketCap?: string;
    liquidity?: string;
    spokeToken?: Token;
  }

  export interface Token {
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

  export interface TokenSearchResponse {
    data: Token[];
  }

  export interface GetTokensResponse {
    data: Token[];
    cursor?: number;
  }

  // --- Chain Types ---

  export interface Chain {
    chainId: number;
    name: string;
    type?: string;
    [key: string]: unknown;
  }

  // --- Quote Types ---

  export type TradeType = "EXACT_INPUT" | "EXACT_OUTPUT";
  export type ExactOutMethod = "native" | "adaptive";
  export type RouteTag = "1-click" | "needs-approval";

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

  export interface Quote {
    amountIn: string;
    amountOut: string;
    minAmountOut?: string;
    slippageTolerance?: number;
    expectedDurationSeconds: number;
    validBefore: number;
    estimatedGas?: string;
    tags?: RouteTag[];
  }

  export interface Route {
    routeId: string;
    type: string;
    icon?: string;
    exactOutMethod?: ExactOutMethod;
    tags?: RouteTag[];
    quote: Quote;
  }

  export interface GetQuotesResponse {
    quoteId: string;
    routes: Route[];
  }

  export interface StreamingRoute extends Route {
    quoteId: string;
  }

  // --- Deposit Types ---

  export interface EIP1193RequestApproval {
    type: "eip1193_request";
    request: {
      method: string;
      params: unknown[];
    };
    waitForReceipt?: boolean;
    deposit?: boolean;
  }

  export interface SolanaApproval {
    type: "solana_sendTransaction";
    transaction: string;
    deposit?: boolean;
  }

  export type Approval = EIP1193RequestApproval | SolanaApproval;

  export interface ContractCallDeposit {
    kind: "CONTRACT_CALL";
    approvals?: Approval[];
  }

  export type Deposit = ContractCallDeposit;

  // --- Submit Types ---

  export interface SubmitDepositResponse {
    orderId: string;
    txHash: string;
  }

  // --- Order Types ---

  export type OrderStatus =
    | "created"
    | "deposited"
    | "published"
    | "filled"
    | "refund_pending"
    | "refunded"
    | "failed";

  export interface OnChainTx {
    timestamp: string;
    txHash: string;
    chainId: number;
    amount?: string;
  }

  export interface OrderTransactions {
    deposit?: OnChainTx;
    fill?: OnChainTx;
    refund?: OnChainTx;
  }

  export interface OrderTimestamps {
    createdAt: string;
    publishedAt?: string;
    failedAt?: string;
  }

  export interface TokenMeta {
    symbol: string;
    decimals: number;
    logoURI: string | null;
  }

  export interface Order {
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

  export interface GetOrderResponse {
    data: Order[];
    cursor?: number;
  }
}
