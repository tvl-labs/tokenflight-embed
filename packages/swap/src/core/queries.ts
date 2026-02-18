import { createQuery } from "@tanstack/solid-query";
import type { QuoteRequest, QuoteResponse, OrderResponse } from "../types/api";
import { KhalaniClient } from "./khalani-client";

export function createQuoteQuery(
  client: () => KhalaniClient | null,
  request: () => QuoteRequest | null,
  enabled: () => boolean
) {
  return createQuery(() => ({
    queryKey: ["quote", request()] as const,
    queryFn: async () => {
      const c = client();
      const r = request();
      if (!c || !r) throw new Error("Missing client or request");
      return c.getQuote(r);
    },
    enabled: enabled() && !!client() && !!request(),
    refetchInterval: 15000,
    staleTime: 10000,
  }));
}

export function createOrderQuery(
  client: () => KhalaniClient | null,
  orderId: () => string | null,
  enabled: () => boolean
) {
  return createQuery(() => {
    const id = orderId();
    return {
      queryKey: ["order", id] as const,
      queryFn: async () => {
        const c = client();
        if (!c || !id) throw new Error("Missing client or orderId");
        return c.getOrder(id);
      },
      enabled: enabled() && !!client() && !!id,
      refetchInterval: (query: { state: { data?: OrderResponse } }) => {
        const data = query.state.data;
        if (
          data &&
          (data.status === "completed" ||
            data.status === "failed" ||
            data.status === "refunded")
        ) {
          return false;
        }
        return 3000;
      },
    };
  });
}

export function createTokenListQuery(
  client: () => KhalaniClient | null,
  enabled: () => boolean
) {
  return createQuery(() => ({
    queryKey: ["tokenList"] as const,
    queryFn: async () => {
      const c = client();
      if (!c) throw new Error("Missing client");
      const response = await fetch(
        `${(c as unknown as { baseUrl: string }).baseUrl}/tokens`
      );
      return response.json();
    },
    enabled: enabled() && !!client(),
    staleTime: 5 * 60 * 1000,
  }));
}
