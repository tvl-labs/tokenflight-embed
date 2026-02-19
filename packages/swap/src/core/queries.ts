import { createQuery } from "@tanstack/solid-query";
import type { QuoteRequest, OrderResponse } from "../types/api";
import { TERMINAL_ORDER_STATUSES } from "../types/api";
import { HyperstreamApi } from "./hyperstream-api";

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
      refetchInterval: (query: { state: { data?: OrderResponse | null } }) => {
        const data = query.state.data;
        if (data && TERMINAL_ORDER_STATUSES.includes(data.status)) {
          return false;
        }
        return 3000;
      },
    };
  });
}

export function createTokenListQuery(
  client: () => HyperstreamApi | null,
  enabled: () => boolean
) {
  return createQuery(() => ({
    queryKey: ["topTokens"] as const,
    queryFn: async () => {
      const c = client();
      if (!c) throw new Error("Missing client");
      return c.getTopTokens();
    },
    enabled: enabled() && !!client(),
    staleTime: 5 * 60 * 1000,
  }));
}

export function createTokenBalancesQuery(
  client: () => HyperstreamApi | null,
  address: () => string | null,
  enabled: () => boolean
) {
  return createQuery(() => ({
    queryKey: ["tokenBalances", address()] as const,
    queryFn: async () => {
      const c = client();
      const addr = address();
      if (!c || !addr) throw new Error("Missing client or address");
      return c.getTokenBalances(addr);
    },
    enabled: enabled() && !!client() && !!address(),
    staleTime: 30 * 1000,
  }));
}
