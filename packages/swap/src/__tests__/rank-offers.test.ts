import { describe, it, expect } from "vitest";
import {
  rankSwapOffers,
  rankOffers,
  getBestOverallSwapRouteId,
  getBestOverallRouteId,
  buildSwapOffersForRanking,
  buildOffersForRanking,
  type SwapOfferForRanking,
  type OfferForRanking,
} from "../services/rank-offers";
import type { QuoteRoute } from "../types/api";

describe("rankSwapOffers", () => {
  it("returns empty for empty offers", () => {
    expect(rankSwapOffers([])).toEqual([]);
  });

  it("returns single offer", () => {
    const offers: SwapOfferForRanking[] = [
      { routeId: "r-1", amountOut: 1000000n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: false },
    ];
    expect(rankSwapOffers(offers)).toEqual(["r-1"]);
  });

  it("ranks by highest output first", () => {
    const offers: SwapOfferForRanking[] = [
      { routeId: "low", amountOut: 900000n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: false },
      { routeId: "high", amountOut: 1000000n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: false },
    ];
    const ranked = rankSwapOffers(offers);
    expect(ranked[0]).toBe("high");
  });

  it("prefers guaranteed output within competitive set", () => {
    // Both within 10bps, but one has guaranteed output
    const offers: SwapOfferForRanking[] = [
      { routeId: "no-guarantee", amountOut: 1000000n, etaSeconds: 10, isGuaranteedOutput: false, isOneClick: false },
      { routeId: "guaranteed", amountOut: 999500n, etaSeconds: 15, isGuaranteedOutput: true, isOneClick: false },
    ];
    const ranked = rankSwapOffers(offers);
    expect(ranked[0]).toBe("guaranteed");
  });

  it("prefers 1-click within competitive set", () => {
    const offers: SwapOfferForRanking[] = [
      { routeId: "multi-step", amountOut: 1000000n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: false },
      { routeId: "one-click", amountOut: 999800n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: true },
    ];
    const ranked = rankSwapOffers(offers);
    expect(ranked[0]).toBe("one-click");
  });

  it("prefers faster within competitive set (same guarantee, same 1-click)", () => {
    const offers: SwapOfferForRanking[] = [
      { routeId: "slow", amountOut: 1000000n, etaSeconds: 30, isGuaranteedOutput: false, isOneClick: false },
      { routeId: "fast", amountOut: 999900n, etaSeconds: 10, isGuaranteedOutput: false, isOneClick: false },
    ];
    const ranked = rankSwapOffers(offers);
    expect(ranked[0]).toBe("fast");
  });

  it("puts non-competitive offers after competitive ones", () => {
    const offers: SwapOfferForRanking[] = [
      { routeId: "very-low", amountOut: 500000n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: false },
      { routeId: "best", amountOut: 1000000n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: false },
      { routeId: "competitive", amountOut: 999500n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: false },
    ];
    const ranked = rankSwapOffers(offers);
    // best and competitive should be first (within 10bps)
    expect(ranked.indexOf("very-low")).toBe(2);
  });
});

describe("rankOffers (EXACT_OUTPUT)", () => {
  it("returns empty for empty offers", () => {
    expect(rankOffers([])).toEqual([]);
  });

  it("ranks by lowest input first", () => {
    const offers: OfferForRanking[] = [
      { routeId: "expensive", amountIn: 1100000n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: false },
      { routeId: "cheap", amountIn: 1000000n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: false },
    ];
    const ranked = rankOffers(offers);
    expect(ranked[0]).toBe("cheap");
  });

  it("prefers guaranteed output within competitive set", () => {
    const offers: OfferForRanking[] = [
      { routeId: "no-guarantee", amountIn: 1000000n, etaSeconds: 15, isGuaranteedOutput: false, isOneClick: false },
      { routeId: "guaranteed", amountIn: 1000500n, etaSeconds: 15, isGuaranteedOutput: true, isOneClick: false },
    ];
    const ranked = rankOffers(offers);
    expect(ranked[0]).toBe("guaranteed");
  });
});

describe("buildSwapOffersForRanking", () => {
  it("converts API routes to ranking offers", () => {
    const routes: QuoteRoute[] = [
      {
        routeId: "r-1",
        type: "native-filler",
        tags: ["1-click"],
        quote: {
          amountIn: "1000000",
          amountOut: "998000",
          expectedDurationSeconds: 15,
          validBefore: 0,
        },
      },
    ];
    const offers = buildSwapOffersForRanking(routes);
    expect(offers).toHaveLength(1);
    expect(offers[0]!.routeId).toBe("r-1");
    expect(offers[0]!.amountOut).toBe(998000n);
    expect(offers[0]!.isOneClick).toBe(true);
    expect(offers[0]!.etaSeconds).toBe(15);
  });
});

describe("buildOffersForRanking", () => {
  it("sets isGuaranteedOutput for native EXACT_OUTPUT", () => {
    const routes: QuoteRoute[] = [
      {
        routeId: "r-1",
        type: "native-filler",
        exactOutMethod: "native",
        quote: {
          amountIn: "1000000",
          amountOut: "998000",
          expectedDurationSeconds: 15,
          validBefore: 0,
        },
      },
    ];
    const offers = buildOffersForRanking(routes, "EXACT_OUTPUT");
    expect(offers[0]!.isGuaranteedOutput).toBe(true);
  });

  it("does not set isGuaranteedOutput for adaptive", () => {
    const routes: QuoteRoute[] = [
      {
        routeId: "r-1",
        type: "native-filler",
        exactOutMethod: "adaptive",
        quote: {
          amountIn: "1000000",
          amountOut: "998000",
          expectedDurationSeconds: 15,
          validBefore: 0,
        },
      },
    ];
    const offers = buildOffersForRanking(routes, "EXACT_OUTPUT");
    expect(offers[0]!.isGuaranteedOutput).toBe(false);
  });
});

describe("getBestOverallSwapRouteId", () => {
  it("returns null for empty routes", () => {
    expect(getBestOverallSwapRouteId([])).toBeNull();
  });

  it("returns best route id", () => {
    const routes: QuoteRoute[] = [
      {
        routeId: "r-1",
        type: "native-filler",
        quote: { amountIn: "1000000", amountOut: "900000", expectedDurationSeconds: 15, validBefore: 0 },
      },
      {
        routeId: "r-2",
        type: "external",
        quote: { amountIn: "1000000", amountOut: "998000", expectedDurationSeconds: 15, validBefore: 0 },
      },
    ];
    expect(getBestOverallSwapRouteId(routes)).toBe("r-2");
  });
});

describe("getBestOverallRouteId", () => {
  it("returns null for empty routes", () => {
    expect(getBestOverallRouteId([], "EXACT_OUTPUT")).toBeNull();
  });

  it("returns cheapest route for EXACT_OUTPUT", () => {
    const routes: QuoteRoute[] = [
      {
        routeId: "r-expensive",
        type: "filler",
        quote: { amountIn: "1100000", amountOut: "1000000", expectedDurationSeconds: 15, validBefore: 0 },
      },
      {
        routeId: "r-cheap",
        type: "filler",
        quote: { amountIn: "1000000", amountOut: "1000000", expectedDurationSeconds: 15, validBefore: 0 },
      },
    ];
    expect(getBestOverallRouteId(routes, "EXACT_OUTPUT")).toBe("r-cheap");
  });
});
