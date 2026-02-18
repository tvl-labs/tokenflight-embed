import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  EvmAddressSchema,
  SolanaAddressSchema,
  TokenTargetSchema,
  AmountSchema,
  SwapConfigSchema,
  ReceiveConfigSchema,
} from "../core/validation";

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
      slippage: 50,
      fromToken: { chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
      toToken: "eip155:8453:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid theme", () => {
    const result = v.safeParse(SwapConfigSchema, { theme: "neon" });
    expect(result.success).toBe(false);
  });

  it("rejects slippage > 5000", () => {
    const result = v.safeParse(SwapConfigSchema, { slippage: 10000 });
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
