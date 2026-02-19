import { describe, it, expect, beforeEach, vi } from "vitest";
import { queryClient } from "../queries/query-client";
import {
  clearTokenCache,
  getCachedToken,
  getTokenInfoQueryKey,
  primeTokenCaches,
  resolveToken,
  setCachedToken,
} from "../services/token-resolver";

// Mock localStorage
const store = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
  removeItem: vi.fn((key: string) => { store.delete(key); }),
  get length() { return store.size; },
  key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
  clear: vi.fn(() => store.clear()),
};

vi.stubGlobal("localStorage", localStorageMock);

describe("Token Resolver Cache", () => {
  beforeEach(() => {
    store.clear();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns null for uncached token", () => {
    const result = getCachedToken(1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect(result).toBeNull();
  });

  it("caches and retrieves token", () => {
    const token = { chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin", decimals: 6 };
    setCachedToken(token);
    const result = getCachedToken(1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect(result).toEqual(token);
  });

  it("is case-insensitive on address", () => {
    const token = { chainId: 1, address: "0xA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48", symbol: "USDC" };
    setCachedToken(token);
    const result = getCachedToken(1, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
    expect(result).toEqual(token);
  });

  it("returns null for expired cache", () => {
    const token = { chainId: 1, address: "0xaddr", symbol: "TEST" };
    // Manually set with old timestamp
    const key = "tf:token:1:0xaddr";
    store.set(key, JSON.stringify({ token, timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000 }));

    const result = getCachedToken(1, "0xaddr");
    expect(result).toBeNull();
  });

  it("clearTokenCache removes all tf: entries", () => {
    store.set("tf:token:1:0xaaa", "data");
    store.set("tf:token:8453:0xbbb", "data");
    store.set("other:key", "data");

    clearTokenCache();
    expect(store.has("tf:token:1:0xaaa")).toBe(false);
    expect(store.has("tf:token:8453:0xbbb")).toBe(false);
    expect(store.has("other:key")).toBe(true);
  });

  it("resolveToken uses HyperstreamApi client and then hits query cache", async () => {
    const client = {
      searchTokens: vi.fn().mockResolvedValue({
        data: [
          {
            chainId: 1,
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            logoURI: "https://example.com/usdc.png",
          },
        ],
      }),
    } as any;

    const first = await resolveToken(1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", undefined, client);
    const second = await resolveToken(1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", undefined, client);

    expect(first.symbol).toBe("USDC");
    expect(second.symbol).toBe("USDC");
    expect(client.searchTokens).toHaveBeenCalledOnce();
  });

  it("primeTokenCaches writes token into query client", () => {
    const token = {
      chainId: 8453,
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    };

    primeTokenCaches(token);

    const cached = queryClient.getQueryData(getTokenInfoQueryKey(8453, token.address));
    expect(cached).toEqual(token);
  });
});
