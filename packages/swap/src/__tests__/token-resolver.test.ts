import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCachedToken, setCachedToken, clearTokenCache } from "../core/token-resolver";

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
});
