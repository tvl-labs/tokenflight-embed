import { describe, it, expect } from "vitest";
import {
  toDisplayAmount,
  toBaseUnits,
  computeExchangeRate,
  formatDisplayAmount,
} from "../core/amount-utils";

describe("toDisplayAmount", () => {
  it("converts USDC base units (6 decimals)", () => {
    expect(toDisplayAmount("1000000", 6)).toBe("1");
    expect(toDisplayAmount("1500000", 6)).toBe("1.5");
    expect(toDisplayAmount("100", 6)).toBe("0.0001");
    expect(toDisplayAmount("1", 6)).toBe("0.000001");
  });

  it("converts ETH base units (18 decimals)", () => {
    expect(toDisplayAmount("1000000000000000000", 18)).toBe("1");
    expect(toDisplayAmount("500000000000000000", 18)).toBe("0.5");
    expect(toDisplayAmount("1234567890000000000", 18)).toBe("1.23456789");
  });

  it("handles zero decimals", () => {
    expect(toDisplayAmount("42", 0)).toBe("42");
  });

  it("handles zero amount", () => {
    expect(toDisplayAmount("0", 6)).toBe("0");
  });

  it("handles empty string", () => {
    expect(toDisplayAmount("", 6)).toBe("0");
  });

  it("handles hex strings", () => {
    expect(toDisplayAmount("0xF4240", 6)).toBe("1");
  });

  it("strips trailing zeros from fractional part", () => {
    expect(toDisplayAmount("1000000000000000000", 18)).toBe("1");
    expect(toDisplayAmount("1100000", 6)).toBe("1.1");
  });

  it("handles large amounts", () => {
    expect(toDisplayAmount("1000000000000", 6)).toBe("1000000");
  });
});

describe("toBaseUnits", () => {
  it("converts display USDC to base units", () => {
    expect(toBaseUnits("1", 6)).toBe("1000000");
    expect(toBaseUnits("1.5", 6)).toBe("1500000");
    expect(toBaseUnits("0.000001", 6)).toBe("1");
  });

  it("converts display ETH to base units", () => {
    expect(toBaseUnits("1", 18)).toBe("1000000000000000000");
    expect(toBaseUnits("0.5", 18)).toBe("500000000000000000");
  });

  it("truncates excess decimals", () => {
    // 6 decimal token with more decimals should truncate
    expect(toBaseUnits("1.0000001", 6)).toBe("1000000");
  });

  it("handles zero amount", () => {
    expect(toBaseUnits("0", 6)).toBe("0");
  });

  it("handles empty string", () => {
    expect(toBaseUnits("", 6)).toBe("0");
  });

  it("handles integer amounts", () => {
    expect(toBaseUnits("100", 6)).toBe("100000000");
  });
});

describe("computeExchangeRate", () => {
  it("computes 1:1 rate for equal decimals equal amounts", () => {
    expect(computeExchangeRate("1000000", 6, "1000000", 6)).toBe("1");
  });

  it("computes rate for USDC -> ETH", () => {
    // 1000 USDC (6 dec) -> 0.3 ETH (18 dec)
    const rate = computeExchangeRate("1000000000", 6, "300000000000000000", 18);
    expect(rate).toBe("0.0003");
  });

  it("returns 0 for zero input", () => {
    expect(computeExchangeRate("0", 6, "1000000", 6)).toBe("0");
  });

  it("returns 0 for empty input", () => {
    expect(computeExchangeRate("", 6, "1000000", 6)).toBe("0");
  });
});

describe("formatDisplayAmount", () => {
  it("limits decimal places", () => {
    expect(formatDisplayAmount("1.123456789", 4)).toBe("1.1234");
  });

  it("strips trailing zeros", () => {
    expect(formatDisplayAmount("1.10000", 6)).toBe("1.1");
  });

  it("handles integer amounts", () => {
    expect(formatDisplayAmount("42")).toBe("42");
  });

  it("handles zero", () => {
    expect(formatDisplayAmount("0")).toBe("0");
  });

  it("handles empty string", () => {
    expect(formatDisplayAmount("")).toBe("0");
  });
});
