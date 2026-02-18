import { describe, it, expect } from "vitest";
import { t } from "../i18n";

describe("i18n", () => {
  it("translates known key", () => {
    expect(t("swap.title")).toBe("TokenFlight");
  });

  it("returns key for unknown key", () => {
    expect(t("nonexistent.key")).toBe("nonexistent.key");
  });

  it("interpolates parameters", () => {
    expect(t("swap.balance", { balance: "1,234.56" })).toBe("Balance: 1,234.56");
  });

  it("interpolates multiple parameters", () => {
    expect(t("receive.buy", { amount: "100", symbol: "USDC" })).toBe("Buy 100 USDC");
  });

  it("handles missing parameters gracefully", () => {
    const result = t("swap.balance");
    expect(result).toBe("Balance: {balance}");
  });

  it("translates fee with value", () => {
    expect(t("receive.fee", { value: "0.16" })).toBe("fee: $0.16");
  });

  it("translates time values", () => {
    expect(t("time.seconds", { value: "15" })).toBe("~15s");
  });
});
