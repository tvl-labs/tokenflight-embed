import { describe, it, expect } from "vitest";
import { createSwapStateMachine } from "../core/state-machine";

describe("SwapStateMachine", () => {
  it("starts in idle phase", () => {
    const sm = createSwapStateMachine();
    expect(sm.state().phase).toBe("idle");
  });

  it("transitions idle -> quoting", () => {
    const sm = createSwapStateMachine();
    const result = sm.transition("quoting");
    expect(result).toBe(true);
    expect(sm.state().phase).toBe("quoting");
  });

  it("transitions quoting -> quoted", () => {
    const sm = createSwapStateMachine();
    sm.transition("quoting");
    const result = sm.transition("quoted");
    expect(result).toBe(true);
    expect(sm.state().phase).toBe("quoted");
  });

  it("follows full success path", () => {
    const sm = createSwapStateMachine();
    expect(sm.transition("quoting")).toBe(true);
    expect(sm.transition("quoted")).toBe(true);
    expect(sm.transition("building")).toBe(true);
    expect(sm.transition("awaiting-wallet")).toBe(true);
    expect(sm.transition("submitting")).toBe(true);
    expect(sm.transition("tracking")).toBe(true);
    expect(sm.transition("success")).toBe(true);
    expect(sm.state().phase).toBe("success");
  });

  it("rejects invalid transition idle -> quoted", () => {
    const sm = createSwapStateMachine();
    const result = sm.transition("quoted");
    expect(result).toBe(false);
    expect(sm.state().phase).toBe("idle");
  });

  it("rejects invalid transition idle -> success", () => {
    const sm = createSwapStateMachine();
    const result = sm.transition("success");
    expect(result).toBe(false);
    expect(sm.state().phase).toBe("idle");
  });

  it("allows error from quoting", () => {
    const sm = createSwapStateMachine();
    sm.transition("quoting");
    const result = sm.transition("error");
    expect(result).toBe(true);
    expect(sm.state().phase).toBe("error");
  });

  it("allows retry from error -> quoted", () => {
    const sm = createSwapStateMachine();
    sm.transition("quoting");
    sm.transition("quoted");
    sm.transition("building");
    sm.transition("error");
    const result = sm.transition("quoted");
    expect(result).toBe(true);
    expect(sm.state().phase).toBe("quoted");
  });

  it("allows error -> idle reset", () => {
    const sm = createSwapStateMachine();
    sm.transition("quoting");
    sm.transition("error");
    const result = sm.transition("idle");
    expect(result).toBe(true);
    expect(sm.state().phase).toBe("idle");
  });

  it("sets and reads from token", () => {
    const sm = createSwapStateMachine();
    sm.setFromToken({ chainId: 1, address: "0x...", symbol: "USDC" });
    expect(sm.state().fromToken?.symbol).toBe("USDC");
  });

  it("sets and reads to token", () => {
    const sm = createSwapStateMachine();
    sm.setToToken({ chainId: 8453, address: "0x...", symbol: "USDC" });
    expect(sm.state().toToken?.chainId).toBe(8453);
  });

  it("sets input amount", () => {
    const sm = createSwapStateMachine();
    sm.setInputAmount("1000");
    expect(sm.state().inputAmount).toBe("1000");
  });

  it("sets wallet address", () => {
    const sm = createSwapStateMachine();
    sm.setWalletAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
    expect(sm.state().walletAddress).toBe("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  });

  it("reset preserves tokens and wallet", () => {
    const sm = createSwapStateMachine();
    sm.setFromToken({ chainId: 1, address: "0x...", symbol: "USDC" });
    sm.setWalletAddress("0xabc");
    sm.setInputAmount("500");
    sm.reset();
    expect(sm.state().phase).toBe("idle");
    expect(sm.state().fromToken?.symbol).toBe("USDC");
    expect(sm.state().walletAddress).toBe("0xabc");
    expect(sm.state().inputAmount).toBe("");
  });
});
