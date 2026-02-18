import { describe, it, expect } from "vitest";
import { parseTokenIdentifier } from "../core/caip10";
import { ErrorCode } from "../types/errors";

describe("parseTokenIdentifier", () => {
  it("parses CAIP-10 EVM string", () => {
    const result = parseTokenIdentifier("eip155:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect(result).toEqual({
      chainId: 1,
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    });
  });

  it("parses CAIP-10 Solana string", () => {
    const result = parseTokenIdentifier("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    expect(result).toEqual({
      chainId: 20011000000,
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    });
  });

  it("parses CAIP-10 arbitrary EIP-155 chain", () => {
    const result = parseTokenIdentifier("eip155:42161:0x912CE59144191C1D966210CFC9c8b00cA54E5F3A");
    expect(result).toEqual({
      chainId: 42161,
      address: "0x912CE59144191C1D966210CFC9c8b00cA54E5F3A",
    });
  });

  it("parses JSON string", () => {
    const result = parseTokenIdentifier('{"chainId":8453,"address":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}');
    expect(result).toEqual({
      chainId: 8453,
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    });
  });

  it("accepts direct object", () => {
    const result = parseTokenIdentifier({ chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" });
    expect(result).toEqual({
      chainId: 1,
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    });
  });

  it("throws TF1002 for invalid CAIP-10 format", () => {
    expect(() => parseTokenIdentifier("invalid")).toThrow();
    try {
      parseTokenIdentifier("invalid");
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.INVALID_TOKEN_IDENTIFIER);
    }
  });

  it("throws TF1002 for empty parts", () => {
    expect(() => parseTokenIdentifier("eip155::0xabc")).toThrow();
  });

  it("throws TF1002 for unknown namespace", () => {
    expect(() => parseTokenIdentifier("cosmos:cosmoshub-4:cosmos1...")).toThrow();
    try {
      parseTokenIdentifier("cosmos:cosmoshub-4:cosmos1...");
    } catch (e: any) {
      expect(e.code).toBe(ErrorCode.INVALID_TOKEN_IDENTIFIER);
    }
  });

  it("throws TF1002 for invalid JSON", () => {
    expect(() => parseTokenIdentifier('{"invalid"}')).toThrow();
  });

  it("throws TF1002 for object with missing fields", () => {
    expect(() => parseTokenIdentifier({ chainId: "not-a-number" as any, address: "0x..." })).toThrow();
  });
});
