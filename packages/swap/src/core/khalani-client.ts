import type { QuoteRequest, QuoteResponse, OrderResponse } from "../types/api";
import { ErrorCode, TokenFlightError } from "../types/errors";
import * as v from "valibot";
import { QuoteResponseSchema } from "./validation";

const DEFAULT_TIMEOUT = 15000;

export interface DepositBuildRequest {
  quoteId: string;
  routeId: string;
  senderAddress: string;
}

export interface DepositBuildResponse {
  actions: Array<{
    type: string;
    chainId?: number;
    method?: string;
    params?: unknown[];
    transaction?: string;
  }>;
}

export interface SubmitDepositRequest {
  quoteId: string;
  routeId: string;
  txHash: string;
  senderAddress: string;
}

export class KhalaniClient {
  private baseUrl: string;

  constructor(apiEndpoint: string) {
    this.baseUrl = apiEndpoint.replace(/\/$/, "");
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const data = await this.fetch<QuoteResponse>("/quote", {
      method: "POST",
      body: JSON.stringify(request),
    });

    try {
      v.parse(QuoteResponseSchema, data);
    } catch (err) {
      throw new TokenFlightError(
        ErrorCode.API_INVALID_RESPONSE,
        "Invalid quote response from API",
        err
      );
    }

    return data;
  }

  async depositBuild(
    request: DepositBuildRequest
  ): Promise<DepositBuildResponse> {
    return this.fetch<DepositBuildResponse>("/deposit/build", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async submitDeposit(request: SubmitDepositRequest): Promise<OrderResponse> {
    return this.fetch<OrderResponse>("/deposit/submit", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getOrder(orderId: string): Promise<OrderResponse> {
    return this.fetch<OrderResponse>(`/orders/${encodeURIComponent(orderId)}`);
  }

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
          { status: response.status, body: errorBody }
        );
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof TokenFlightError) throw err;

      if (err instanceof DOMException && err.name === "TimeoutError") {
        throw new TokenFlightError(
          ErrorCode.API_TIMEOUT,
          `API request timed out: ${path}`,
          err
        );
      }

      throw new TokenFlightError(
        ErrorCode.API_REQUEST_FAILED,
        `API request failed: ${String(err)}`,
        err
      );
    }
  }
}
