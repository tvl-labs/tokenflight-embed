import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HyperstreamApi } from "../api/hyperstream-api";

describe("chain-registry", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exposes fallback chains before API data is loaded", async () => {
    const chainRegistry = await import("../services/chain-registry");
    expect(chainRegistry.getChainDisplay(1)?.name).toBe("Ethereum");
  });

  it("normalizes chainId values from /v1/chains response", async () => {
    const chainRegistry = await import("../services/chain-registry");
    const client = {
      getChains: vi.fn().mockResolvedValue([
        { chainId: "1", name: "Ethereum" },
        { chainId: 8453, name: "Base" },
      ]),
    } as unknown as HyperstreamApi;

    const chains = await chainRegistry.loadChains(client);

    expect(chains[0]?.chainId).toBe(1);
    expect(chainRegistry.getChainDisplay("1")?.name).toBe("Ethereum");
    expect(chainRegistry.getChainDisplay(8453)?.name).toBe("Base");
  });

  it("falls back to built-in list when API data is invalid", async () => {
    const chainRegistry = await import("../services/chain-registry");
    const client = {
      getChains: vi.fn().mockResolvedValue([{ chainId: "", name: "" }]),
    } as unknown as HyperstreamApi;

    const chains = await chainRegistry.loadChains(client);
    const names = chains.map((c) => c.name);

    expect(names).toContain("Ethereum");
    expect(chainRegistry.getChainDisplay(1)?.name).toBe("Ethereum");
  });
});
