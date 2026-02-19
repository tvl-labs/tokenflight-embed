import { describe, expect, it } from "vitest";
import { formatNativeFee } from "../helpers/native-fee";

describe("formatNativeFee", () => {
  it("formats EVM wei to ETH", () => {
    expect(formatNativeFee("1000000000000000", 1)).toBe("0.001 ETH");
  });

  it("formats Solana lamports to SOL", () => {
    expect(formatNativeFee("5000000", 20011000000)).toBe("0.005 SOL");
  });

  it("handles decimal fee input as already-display amount", () => {
    expect(formatNativeFee("0.012345", 8453)).toBe("0.012345 ETH");
  });

  it("falls back to default native symbol", () => {
    expect(formatNativeFee("1000000000000000000", 999999)).toBe("1 ETH");
  });
});

