import type { QuoteRoute, TradeType, ExactOutMethod } from "../types/api";

/**
 * Minimal offer data needed for ranking swap offers.
 * For swap (EXACT_INPUT): higher amountOut is better.
 */
export interface SwapOfferForRanking {
  routeId: string;
  amountOut: bigint;
  etaSeconds: number;
  isGuaranteedOutput: boolean;
  isOneClick: boolean;
}

/**
 * Minimal offer data needed for ranking offers.
 * For offers (EXACT_OUTPUT): lower amountIn is better.
 */
export interface OfferForRanking {
  routeId: string;
  amountIn: bigint;
  etaSeconds: number;
  isGuaranteedOutput: boolean;
  isOneClick: boolean;
}

function hasOneClickTag(tags: string[] | undefined): boolean {
  return tags?.includes("1-click") ?? false;
}

function parseBigIntSafe(value: string): bigint | null {
  try {
    if (value.startsWith("0x")) return BigInt(value);
    return BigInt(value);
  } catch {
    return null;
  }
}

/**
 * Build swap offers for ranking from API routes.
 */
export function buildSwapOffersForRanking(
  routes: readonly QuoteRoute[],
): SwapOfferForRanking[] {
  return routes.map((r) => {
    const amountOut = parseBigIntSafe(r.quote.amountOut) ?? 0n;
    return {
      routeId: r.routeId,
      amountOut,
      etaSeconds: Number.isFinite(r.quote.expectedDurationSeconds)
        ? r.quote.expectedDurationSeconds
        : Number.MAX_SAFE_INTEGER,
      isGuaranteedOutput: false,
      isOneClick: hasOneClickTag(r.tags),
    };
  });
}

/**
 * Build offers for ranking from API routes (EXACT_OUTPUT mode).
 */
export function buildOffersForRanking(
  routes: readonly QuoteRoute[],
  tradeType: TradeType | null,
): OfferForRanking[] {
  return routes.map((r) => {
    const amountIn = parseBigIntSafe(r.quote.amountIn) ?? BigInt(Number.MAX_SAFE_INTEGER);
    const isGuaranteedOutput =
      tradeType === "EXACT_OUTPUT" &&
      r.exactOutMethod === ("native" satisfies ExactOutMethod);

    return {
      routeId: r.routeId,
      amountIn,
      etaSeconds: Number.isFinite(r.quote.expectedDurationSeconds)
        ? r.quote.expectedDurationSeconds
        : Number.MAX_SAFE_INTEGER,
      isGuaranteedOutput,
      isOneClick: hasOneClickTag(r.tags),
    };
  });
}

/**
 * Rank swap offers where higher output amount is better.
 *
 * Algorithm:
 * 1. Find best price (highest output amount)
 * 2. Filter to competitive set (within 10bps/0.1% of best)
 * 3. Within competitive set: guaranteed output > 1-click > speed
 * 4. Return all offers: competitive ranked first, then rest by price
 */
export function rankSwapOffers(offers: readonly SwapOfferForRanking[]): string[] {
  if (offers.length === 0) return [];

  // Step 1: Find best price (highest output)
  let bestAmountOut = offers[0]!.amountOut;
  for (const r of offers) {
    if (r.amountOut > bestAmountOut) {
      bestAmountOut = r.amountOut;
    }
  }

  // Step 2: Competitive set = within 10bps (0.1%) of best
  // threshold = bestAmountOut * 999 / 1000
  const threshold = (bestAmountOut * 999n) / 1000n;
  const competitiveOffers = offers.filter((r) => r.amountOut >= threshold);

  // Step 3: Rank competitive by guaranteed > 1-click > speed
  const ranked = [...competitiveOffers].sort((a, b) => {
    if (a.isGuaranteedOutput !== b.isGuaranteedOutput) {
      return a.isGuaranteedOutput ? -1 : 1;
    }
    if (a.isOneClick !== b.isOneClick) {
      return a.isOneClick ? -1 : 1;
    }
    return a.etaSeconds - b.etaSeconds;
  });

  // Step 4: Non-competitive by descending output
  const competitiveIds = new Set(ranked.map((r) => r.routeId));
  const nonCompetitive = offers
    .filter((r) => !competitiveIds.has(r.routeId))
    .sort((a, b) => (b.amountOut > a.amountOut ? 1 : b.amountOut < a.amountOut ? -1 : 0));

  return [
    ...ranked.map((r) => r.routeId),
    ...nonCompetitive.map((r) => r.routeId),
  ];
}

/**
 * Rank offers where lower input amount is better (EXACT_OUTPUT).
 *
 * Same algorithm as rankSwapOffers but inverted:
 * best price = lowest amountIn, threshold = lowestAmountIn * 1.001
 */
export function rankOffers(offers: readonly OfferForRanking[]): string[] {
  if (offers.length === 0) return [];

  // Step 1: Find best price (lowest input)
  let lowestAmountIn = offers[0]!.amountIn;
  for (const r of offers) {
    if (r.amountIn < lowestAmountIn) {
      lowestAmountIn = r.amountIn;
    }
  }

  // Step 2: Competitive set = within 10bps of best (lowest * 1001 / 1000)
  const threshold = (lowestAmountIn * 1001n) / 1000n;
  const competitiveOffers = offers.filter((r) => r.amountIn <= threshold);

  // Step 3: Rank competitive by guaranteed > 1-click > speed
  const ranked = [...competitiveOffers].sort((a, b) => {
    if (a.isGuaranteedOutput !== b.isGuaranteedOutput) {
      return a.isGuaranteedOutput ? -1 : 1;
    }
    if (a.isOneClick !== b.isOneClick) {
      return a.isOneClick ? -1 : 1;
    }
    return a.etaSeconds - b.etaSeconds;
  });

  // Step 4: Non-competitive by ascending input
  const competitiveIds = new Set(ranked.map((r) => r.routeId));
  const nonCompetitive = offers
    .filter((r) => !competitiveIds.has(r.routeId))
    .sort((a, b) => (a.amountIn > b.amountIn ? 1 : a.amountIn < b.amountIn ? -1 : 0));

  return [
    ...ranked.map((r) => r.routeId),
    ...nonCompetitive.map((r) => r.routeId),
  ];
}

/** Get the best overall route ID for swap (EXACT_INPUT). */
export function getBestOverallSwapRouteId(
  routes: readonly QuoteRoute[],
): string | null {
  const offers = buildSwapOffersForRanking(routes);
  const ranked = rankSwapOffers(offers);
  return ranked[0] ?? null;
}

/** Get the best overall route ID for exact output. */
export function getBestOverallRouteId(
  routes: readonly QuoteRoute[],
  tradeType: TradeType | null,
): string | null {
  const offers = buildOffersForRanking(routes, tradeType);
  const ranked = rankOffers(offers);
  return ranked[0] ?? null;
}
