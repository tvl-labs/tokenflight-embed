import { HyperstreamApi } from "../api/hyperstream-api";
import { TERMINAL_ORDER_STATUSES } from "../types/api";

export interface ProgressivePollingParams {
  orderStatus: HyperstreamApi.OrderStatus | undefined;
  dataUpdatedAt: number;
  now?: number;
}

const POLLING_TIERS = [
  { thresholdMs: 10_000, intervalMs: 1_000 },
  { thresholdMs: 30_000, intervalMs: 2_000 },
  { thresholdMs: 60_000, intervalMs: 3_000 },
  { thresholdMs: 120_000, intervalMs: 5_000 },
] as const;

const DEFAULT_INTERVAL_MS = 10_000;

export function calculateProgressivePollingInterval(
  params: ProgressivePollingParams,
): number | false {
  const { orderStatus, dataUpdatedAt, now = Date.now() } = params;

  if (orderStatus && TERMINAL_ORDER_STATUSES.includes(orderStatus)) {
    return false;
  }

  if (dataUpdatedAt === 0) {
    return POLLING_TIERS[0].intervalMs;
  }

  const elapsedMs = now - dataUpdatedAt;
  for (const tier of POLLING_TIERS) {
    if (elapsedMs < tier.thresholdMs) {
      return tier.intervalMs;
    }
  }

  return DEFAULT_INTERVAL_MS;
}
