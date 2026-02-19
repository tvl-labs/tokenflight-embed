import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  EvmAddressSchema,
  SolanaAddressSchema,
  TokenTargetSchema,
  AmountSchema,
  SwapConfigSchema,
  ReceiveConfigSchema,
  QuoteResponseSchema,
} from "../schemas/validation";

describe("EvmAddressSchema", () => {
  it("accepts valid EVM address", () => {
    const result = v.safeParse(EvmAddressSchema, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect(result.success).toBe(true);
  });

  it("rejects address without 0x prefix", () => {
    const result = v.safeParse(EvmAddressSchema, "A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect(result.success).toBe(false);
  });

  it("rejects short address", () => {
    const result = v.safeParse(EvmAddressSchema, "0xA0b869");
    expect(result.success).toBe(false);
  });

  it("rejects non-hex characters", () => {
    const result = v.safeParse(EvmAddressSchema, "0xG0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect(result.success).toBe(false);
  });
});

describe("SolanaAddressSchema", () => {
  it("accepts valid Solana address", () => {
    const result = v.safeParse(SolanaAddressSchema, "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    expect(result.success).toBe(true);
  });

  it("rejects too short address", () => {
    const result = v.safeParse(SolanaAddressSchema, "abc");
    expect(result.success).toBe(false);
  });
});

describe("TokenTargetSchema", () => {
  it("accepts valid token target", () => {
    const result = v.safeParse(TokenTargetSchema, { chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" });
    expect(result.success).toBe(true);
  });

  it("rejects non-integer chainId", () => {
    const result = v.safeParse(TokenTargetSchema, { chainId: 1.5, address: "0x..." });
    expect(result.success).toBe(false);
  });

  it("rejects zero chainId", () => {
    const result = v.safeParse(TokenTargetSchema, { chainId: 0, address: "0x..." });
    expect(result.success).toBe(false);
  });
});

describe("AmountSchema", () => {
  it("accepts valid integer amount", () => {
    const result = v.safeParse(AmountSchema, "1000");
    expect(result.success).toBe(true);
  });

  it("accepts valid decimal amount", () => {
    const result = v.safeParse(AmountSchema, "100.50");
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = v.safeParse(AmountSchema, "0");
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = v.safeParse(AmountSchema, "-100");
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric string", () => {
    const result = v.safeParse(AmountSchema, "abc");
    expect(result.success).toBe(false);
  });
});

describe("SwapConfigSchema", () => {
  it("accepts minimal config", () => {
    const result = v.safeParse(SwapConfigSchema, {});
    expect(result.success).toBe(true);
  });

  it("accepts full config", () => {
    const result = v.safeParse(SwapConfigSchema, {
      apiEndpoint: "https://api.khalani.network",
      theme: "dark",
      locale: "en-US",
      fromToken: { chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
      toToken: "eip155:8453:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid theme", () => {
    const result = v.safeParse(SwapConfigSchema, { theme: "neon" });
    expect(result.success).toBe(false);
  });

});

describe("ReceiveConfigSchema", () => {
  it("accepts valid receive config", () => {
    const result = v.safeParse(ReceiveConfigSchema, {
      target: { chainId: 8453, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
      amount: "100",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing target", () => {
    const result = v.safeParse(ReceiveConfigSchema, { amount: "100" });
    expect(result.success).toBe(false);
  });

  it("rejects missing amount", () => {
    const result = v.safeParse(ReceiveConfigSchema, {
      target: { chainId: 1, address: "0x..." },
    });
    expect(result.success).toBe(false);
  });
});

describe("QuoteResponseSchema", () => {
  it("accepts valid Hyperstream quote response", () => {
    const result = v.safeParse(QuoteResponseSchema, {
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
    });
    expect(result.success).toBe(true);
  });

  it("accepts route with exactOutMethod", () => {
    const result = v.safeParse(QuoteResponseSchema, {
      quoteId: "q-456",
      routes: [
        {
          routeId: "r-2",
          type: "external-intent-router",
          exactOutMethod: "native",
          quote: {
            amountIn: "1000000",
            amountOut: "998420",
            minAmountOut: "995000",
            slippageTolerance: 0.5,
            expectedDurationSeconds: 30,
            validBefore: Date.now() + 60000,
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid exactOutMethod", () => {
    const result = v.safeParse(QuoteResponseSchema, {
      quoteId: "q-789",
      routes: [
        {
          routeId: "r-3",
          type: "filler",
          exactOutMethod: "invalid",
          quote: {
            amountIn: "1000000",
            amountOut: "998420",
            expectedDurationSeconds: 15,
            validBefore: 0,
          },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty routes array", () => {
    const result = v.safeParse(QuoteResponseSchema, {
      quoteId: "q-empty",
      routes: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing quoteId", () => {
    const result = v.safeParse(QuoteResponseSchema, {
      routes: [],
    });
    expect(result.success).toBe(false);
  });
});
