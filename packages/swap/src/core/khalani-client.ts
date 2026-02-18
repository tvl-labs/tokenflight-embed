import type {
  QuoteRequest,
  QuoteResponse,
  StreamingRoute,
  DepositBuildResponse,
  SubmitDepositResponse,
  OrderResponse,
  OrderListResponse,
  TokenInfo,
  TokenSearchResponse,
  TokenListResponse,
  ChainInfo,
} from "../types/api";
import { ErrorCode, TokenFlightError } from "../types/errors";

const DEFAULT_TIMEOUT = 15000;
const STREAM_TIMEOUT = 30000;

export class KhalaniClient {
  readonly baseUrl: string;

  constructor(apiEndpoint: string) {
    this.baseUrl = apiEndpoint.replace(/\/$/, "");
  }

  // --- Quotes ---

  /** Get quotes (non-streaming). POST /v1/quotes */
  async getQuotes(request: QuoteRequest): Promise<QuoteResponse> {
    return this.fetch<QuoteResponse>("/v1/quotes", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Get quotes using NDJSON streaming mode.
   * Routes arrive one-by-one as each filler responds.
   */
  async getQuotesStream(
    request: QuoteRequest,
    onRoute: (route: StreamingRoute) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const url = `${this.baseUrl}/v1/quotes?mode=stream`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/x-ndjson",
      },
      body: JSON.stringify(request),
      signal: signal ?? AbortSignal.timeout(STREAM_TIMEOUT),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new TokenFlightError(
        ErrorCode.QUOTE_FAILED,
        `Streaming quotes failed: ${response.status} ${response.statusText}`,
        { status: response.status, body: errorBody },
      );
    }

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
          // Flush remaining buffer
          if (buffer.trim()) {
            try {
              onRoute(JSON.parse(buffer.trim()) as StreamingRoute);
            } catch {
              // Ignore malformed final chunk
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete NDJSON lines
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            onRoute(JSON.parse(trimmed) as StreamingRoute);
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

  /** Build deposit actions. POST /v1/deposit/build */
  async depositBuild(params: {
    from: string;
    quoteId: string;
    routeId: string;
  }): Promise<DepositBuildResponse> {
    return this.fetch<DepositBuildResponse>("/v1/deposit/build", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /** Submit deposit tx hash. PUT /v1/deposit/submit */
  async submitDeposit(
    params: { quoteId: string; routeId: string } & (
      | { txHash: string }
      | { signedTransaction: string }
    ),
  ): Promise<SubmitDepositResponse> {
    return this.fetch<SubmitDepositResponse>("/v1/deposit/submit", {
      method: "PUT",
      body: JSON.stringify(params),
    });
  }

  // --- Orders ---

  /** Get orders by address. GET /v1/orders/:address */
  async getOrdersByAddress(
    address: string,
    options?: {
      orderIds?: string[];
      limit?: number;
      cursor?: number;
    },
  ): Promise<OrderListResponse> {
    const params = new URLSearchParams();
    if (options?.orderIds?.length) params.set("orderIds", options.orderIds.join(","));
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.cursor) params.set("cursor", options.cursor.toString());

    const qs = params.toString();
    const path = `/v1/orders/${encodeURIComponent(address)}${qs ? `?${qs}` : ""}`;
    return this.fetch<OrderListResponse>(path);
  }

  /** Get a single order by address + orderId. */
  async getOrderById(address: string, orderId: string): Promise<OrderResponse | null> {
    const result = await this.getOrdersByAddress(address, { orderIds: [orderId] });
    return result.data[0] ?? null;
  }

  // --- Tokens ---

  /** Get tokens. GET /v1/tokens */
  async getTokens(params?: {
    q?: string;
    chainIds?: number[];
    limit?: number;
    cursor?: number;
  }): Promise<TokenListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.chainIds?.length) searchParams.set("chainIds", params.chainIds.join(","));
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.cursor) searchParams.set("cursor", params.cursor.toString());

    const qs = searchParams.toString();
    return this.fetch<TokenListResponse>(`/v1/tokens${qs ? `?${qs}` : ""}`);
  }

  /** Search tokens. GET /v1/tokens/search */
  async searchTokens(
    query: string,
    options?: { chainIds?: number[] },
  ): Promise<TokenSearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (options?.chainIds?.length) params.set("chainIds", options.chainIds.join(","));
    return this.fetch<TokenSearchResponse>(`/v1/tokens/search?${params.toString()}`);
  }

  /** Get top tokens. GET /v1/tokens/top */
  async getTopTokens(params?: {
    chainIds?: number[];
  }): Promise<TokenInfo[]> {
    const searchParams = new URLSearchParams();
    if (params?.chainIds?.length) searchParams.set("chainIds", params.chainIds.join(","));
    const qs = searchParams.toString();
    return this.fetch<TokenInfo[]>(`/v1/tokens/top${qs ? `?${qs}` : ""}`);
  }

  /** Get token balances for address. GET /v1/tokens/balances/:address */
  async getTokenBalances(
    address: string,
    options?: { chainIds?: number[] },
  ): Promise<TokenInfo[]> {
    const params = new URLSearchParams();
    if (options?.chainIds?.length) params.set("chainIds", options.chainIds.join(","));
    const qs = params.toString();
    return this.fetch<TokenInfo[]>(
      `/v1/tokens/balances/${encodeURIComponent(address)}${qs ? `?${qs}` : ""}`,
    );
  }

  // --- Chains ---

  /** Get supported chains. GET /v1/chains */
  async getChains(): Promise<ChainInfo[]> {
    return this.fetch<ChainInfo[]>("/v1/chains");
  }

  // --- Internal ---

  private async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...init?.headers,
        },
        signal: init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new TokenFlightError(
          ErrorCode.API_REQUEST_FAILED,
          `API request failed: ${response.status} ${response.statusText}`,
          { status: response.status, body: errorBody },
        );
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof TokenFlightError) throw err;

      if (err instanceof DOMException && err.name === "TimeoutError") {
        throw new TokenFlightError(
          ErrorCode.API_TIMEOUT,
          `API request timed out: ${path}`,
          err,
        );
      }

      throw new TokenFlightError(
        ErrorCode.API_REQUEST_FAILED,
        `API request failed: ${String(err)}`,
        err,
      );
    }
  }
}
