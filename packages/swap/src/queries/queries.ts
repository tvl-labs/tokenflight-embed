import { createQuery } from "@tanstack/solid-query";
import type { QuoteRequest, OrderResponse } from "../types/api";
import { HyperstreamApi } from "../api/hyperstream-api";
import { calculateProgressivePollingInterval } from "../helpers/progressive-polling";

export function createQuoteQuery(
  client: () => HyperstreamApi | null,
  request: () => QuoteRequest | null,
  enabled: () => boolean
) {
  return createQuery(() => ({
    queryKey: ["quote", request()] as const,
    queryFn: async () => {
      const c = client();
      const r = request();
      if (!c || !r) throw new Error("Missing client or request");
      return c.getQuotes(r);
    },
    enabled: enabled() && !!client() && !!request(),
    refetchInterval: 15000,
    staleTime: 10000,
  }));
}

export function createOrderQuery(
  client: () => HyperstreamApi | null,
  address: () => string | null,
  orderId: () => string | null,
  enabled: () => boolean
) {
  return createQuery(() => {
    const id = orderId();
    const addr = address();
    return {
      queryKey: ["order", addr, id] as const,
      queryFn: async () => {
        const c = client();
        if (!c || !id || !addr) throw new Error("Missing client, address, or orderId");
        return c.getOrderById(addr, id);
      },
      enabled: enabled() && !!client() && !!id && !!addr,
      staleTime: 5000,
      refetchInterval: (query: { state: { data?: OrderResponse | null; dataUpdatedAt?: number } }) => {
        return calculateProgressivePollingInterval({
          orderStatus: query.state.data?.status,
          dataUpdatedAt: query.state.dataUpdatedAt ?? 0,
        });
      },
    };
  });
}

export function createTokenListQuery(
  client: () => HyperstreamApi | null,
  enabled: () => boolean,
  chainIds?: () => number[] | undefined,
) {
  return createQuery(() => ({
    queryKey: ["topTokens", chainIds?.()?.join(",") ?? "all"] as const,
    queryFn: async () => {
      const c = client();
      if (!c) throw new Error("Missing client");
      const ids = chainIds?.();
      return c.getTopTokens(ids?.length ? { chainIds: ids } : undefined);
    },
    enabled: enabled() && !!client(),
    staleTime: 5 * 60 * 1000,
  }));
}

export function createTokenBalancesQuery(
  client: () => HyperstreamApi | null,
  address: () => string | null,
  enabled: () => boolean,
  chainIds?: () => number[] | undefined,
) {
  return createQuery(() => ({
    queryKey: ["tokenBalances", address(), chainIds?.()?.join(",") ?? "all"] as const,
    queryFn: async () => {
      const c = client();
      const addr = address();
      if (!c || !addr) throw new Error("Missing client or address");
      const ids = chainIds?.();
      return c.getTokenBalances(addr, ids?.length ? { chainIds: ids } : undefined);
    },
    enabled: enabled() && !!client() && !!address(),
    staleTime: 30 * 1000,
  }));
}
