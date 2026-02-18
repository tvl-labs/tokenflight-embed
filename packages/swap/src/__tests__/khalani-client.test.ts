import { describe, it, expect, vi, beforeEach } from "vitest";
import { KhalaniClient } from "../core/khalani-client";
import { ErrorCode } from "../types/errors";

const mockQuoteResponse = {
  quoteId: "q-123",
  fromToken: { chainId: 1, address: "0xA0b8...", symbol: "USDC", name: "USD Coin", decimals: 6 },
  toToken: { chainId: 8453, address: "0x8335...", symbol: "USDC", name: "USD Coin", decimals: 6 },
  fromAmount: "1000",
  toAmount: "998.42",
  exchangeRate: "0.99842",
  estimatedFee: "1.58",
  estimatedTime: 15,
  routes: [
    {
      routeId: "r-1",
      provider: "Khalani",
      estimatedOutput: "998.42",
      estimatedFee: "1.58",
      estimatedTime: 15,
      actions: [{ type: "eip1193_request", chainId: 1 }],
    },
  ],
};

describe("KhalaniClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getQuote sends correct request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockQuoteResponse),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new KhalaniClient("https://api.khalani.network");
    const quote = await client.getQuote({
      fromChainId: 1,
      fromTokenAddress: "0xA0b8...",
      toChainId: 8453,
      toTokenAddress: "0x8335...",
      amount: "1000",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.khalani.network/quote");
    expect(quote.quoteId).toBe("q-123");
    expect(quote.toAmount).toBe("998.42");
  });

  it("throws TF3001 on HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve("error"),
    }));

    const client = new KhalaniClient("https://api.khalani.network");
    try {
      await client.getQuote({
        fromChainId: 1,
        fromTokenAddress: "0x...",
        toChainId: 8453,
        toTokenAddress: "0x...",
        amount: "100",
      });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.API_REQUEST_FAILED);
    }
  });

  it("throws TF3002 on timeout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(
      new DOMException("The operation was aborted due to timeout", "TimeoutError")
    ));

    const client = new KhalaniClient("https://api.khalani.network");
    try {
      await client.getQuote({
        fromChainId: 1,
        fromTokenAddress: "0x...",
        toChainId: 8453,
        toTokenAddress: "0x...",
        amount: "100",
      });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.API_TIMEOUT);
    }
  });

  it("getOrder fetches by orderId", async () => {
    const orderResponse = {
      orderId: "ord-1",
      status: "completed",
      fromToken: mockQuoteResponse.fromToken,
      toToken: mockQuoteResponse.toToken,
      fromAmount: "1000",
      toAmount: "998.42",
      txHash: "0xabc",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(orderResponse),
    }));

    const client = new KhalaniClient("https://api.khalani.network");
    const order = await client.getOrder("ord-1");
    expect(order.orderId).toBe("ord-1");
    expect(order.status).toBe("completed");
  });
});
