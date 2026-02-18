import { describe, it, expect, vi, beforeEach } from "vitest";
import { KhalaniClient } from "../core/khalani-client";
import { ErrorCode } from "../types/errors";

const mockQuoteResponse = {
  quoteId: "q-123",
  routes: [
    {
      routeId: "r-1",
      type: "native-filler",
      tags: ["1-click"],
      quote: {
        amountIn: "1000000",
        amountOut: "998420",
        expectedDurationSeconds: 15,
        validBefore: Date.now() + 60000,
        estimatedGas: "50000",
      },
    },
  ],
};

const mockOrderListResponse = {
  data: [
    {
      id: "ord-1",
      type: "swap",
      quoteId: "q-123",
      routeId: "r-1",
      fromChainId: 1,
      fromToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      toChainId: 8453,
      toToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      srcAmount: "1000000",
      destAmount: "998420",
      status: "filled",
      author: "0xuser",
      recipient: null,
      depositTxHash: "0xabc",
      tradeType: "EXACT_INPUT",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:01:00Z",
    },
  ],
  cursor: undefined,
};

describe("KhalaniClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getQuotes sends correct request to /v1/quotes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockQuoteResponse),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new KhalaniClient("https://api.khalani.network");
    const quote = await client.getQuotes({
      tradeType: "EXACT_INPUT",
      fromChainId: 1,
      fromToken: "0xA0b8...",
      toChainId: 8453,
      toToken: "0x8335...",
      amount: "1000000",
      fromAddress: "0xuser",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.khalani.network/v1/quotes");
    expect(quote.quoteId).toBe("q-123");
    expect(quote.routes).toHaveLength(1);
    expect(quote.routes[0]!.quote.amountOut).toBe("998420");
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
      await client.getQuotes({
        tradeType: "EXACT_INPUT",
        fromChainId: 1,
        fromToken: "0x...",
        toChainId: 8453,
        toToken: "0x...",
        amount: "100",
        fromAddress: "0xuser",
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
      await client.getQuotes({
        tradeType: "EXACT_INPUT",
        fromChainId: 1,
        fromToken: "0x...",
        toChainId: 8453,
        toToken: "0x...",
        amount: "100",
        fromAddress: "0xuser",
      });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.API_TIMEOUT);
    }
  });

  it("getOrderById fetches by address and orderId", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrderListResponse),
    }));

    const client = new KhalaniClient("https://api.khalani.network");
    const order = await client.getOrderById("0xuser", "ord-1");
    expect(order).not.toBeNull();
    expect(order!.id).toBe("ord-1");
    expect(order!.status).toBe("filled");
  });

  it("submitDeposit uses PUT method", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ orderId: "ord-1", txHash: "0xabc" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new KhalaniClient("https://api.khalani.network");
    const result = await client.submitDeposit({
      quoteId: "q-123",
      routeId: "r-1",
      txHash: "0xabc",
    });

    expect(fetchMock.mock.calls[0]![1]?.method).toBe("PUT");
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.khalani.network/v1/deposit/submit");
    expect(result.orderId).toBe("ord-1");
  });

  it("depositBuild sends to /v1/deposit/build", async () => {
    const depositResponse = {
      kind: "CONTRACT_CALL",
      approvals: [
        {
          type: "eip1193_request",
          request: { method: "eth_sendTransaction", params: [{}] },
          deposit: true,
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(depositResponse),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new KhalaniClient("https://api.khalani.network");
    const result = await client.depositBuild({
      from: "0xuser",
      quoteId: "q-123",
      routeId: "r-1",
    });

    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.khalani.network/v1/deposit/build");
    expect(result.kind).toBe("CONTRACT_CALL");
    expect(result.approvals).toHaveLength(1);
  });

  it("getTopTokens fetches from /v1/tokens/top", async () => {
    const tokens = [
      { address: "0x...", chainId: 1, name: "USDC", symbol: "USDC", decimals: 6 },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(tokens),
    }));

    const client = new KhalaniClient("https://api.khalani.network");
    const result = await client.getTopTokens();
    expect(result).toHaveLength(1);
    expect(result[0]!.symbol).toBe("USDC");
  });

  it("searchTokens fetches from /v1/tokens/search", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new KhalaniClient("https://api.khalani.network");
    await client.searchTokens("USDC", { chainIds: [1, 8453] });

    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain("/v1/tokens/search");
    expect(url).toContain("q=USDC");
    expect(url).toContain("chainIds=1%2C8453");
  });
});
