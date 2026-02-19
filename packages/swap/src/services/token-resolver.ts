import { HyperstreamApi } from "../api/hyperstream-api";
import { queryClient } from "../queries/query-client";
import type { ResolvedToken, TokenInfo, TokenSearchResponse } from "../types/api";

const CACHE_PREFIX = "tf:token:";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CachedToken {
  token: ResolvedToken;
  timestamp: number;
}

export function getTokenInfoQueryKey(chainId: number, address: string) {
  return ["tokenInfo", chainId, address.toLowerCase()] as const;
}

function getCacheKey(chainId: number, address: string): string {
  return `${CACHE_PREFIX}${chainId}:${address.toLowerCase()}`;
}

function getQueryCachedToken(chainId: number, address: string): ResolvedToken | null {
  return queryClient.getQueryData<ResolvedToken>(getTokenInfoQueryKey(chainId, address)) ?? null;
}

function setQueryCachedToken(token: ResolvedToken): void {
  queryClient.setQueryData(getTokenInfoQueryKey(token.chainId, token.address), token);
}

export function getCachedToken(
  chainId: number,
  address: string
): ResolvedToken | null {
  try {
    const key = getCacheKey(chainId, address);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const cached: CachedToken = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return cached.token;
  } catch {
    return null;
  }
}

export function setCachedToken(token: ResolvedToken): void {
  try {
    const key = getCacheKey(token.chainId, token.address);
    const cached: CachedToken = { token, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function primeTokenCaches(token: ResolvedToken): void {
  setCachedToken(token);
  setQueryCachedToken(token);
}

/** Clear all TokenFlight token cache entries */
export function clearTokenCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export async function resolveToken(
  chainId: number,
  address: string,
  apiEndpoint?: string,
  client?: HyperstreamApi | null
): Promise<ResolvedToken> {
  const queryCached = getQueryCachedToken(chainId, address);
  if (queryCached) return queryCached;

  const cached = getCachedToken(chainId, address);
  if (cached) {
    setQueryCachedToken(cached);
    return cached;
  }

  const resolveFromApiToken = (token: TokenInfo): ResolvedToken => ({
    chainId: token.chainId ?? chainId,
    address: token.address ?? address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.logoURI,
    ...(Number.isFinite(Number(token.extensions?.price?.usd ?? ""))
      ? { priceUsd: Number(token.extensions?.price?.usd ?? "") }
      : {}),
  });

  const findBestMatch = (tokens: TokenInfo[]): TokenInfo | undefined => {
    const targetAddress = address.toLowerCase();
    return (
      tokens.find((token) =>
        Number(token.chainId) === chainId && token.address.toLowerCase() === targetAddress) ??
      tokens.find((token) => Number(token.chainId) === chainId) ??
      tokens[0]
    );
  };

  if (client || apiEndpoint) {
    try {
      const apiClient = client ?? new HyperstreamApi({ baseUrl: apiEndpoint! });
      const data = (await apiClient.searchTokens(address, { chainIds: [chainId] })) as TokenSearchResponse;
      const match = findBestMatch(data.data ?? []);
      if (match) {
        const resolved = resolveFromApiToken(match);
        primeTokenCaches(resolved);
        return resolved;
      }
    } catch {
      // Fall through to basic token
    }
  }

  // Return minimal token without decimals — callers must handle undefined decimals
  // rather than assuming a default that could be wrong (e.g., USDC=6, WBTC=8).
  return { chainId, address, decimals: undefined };
}
