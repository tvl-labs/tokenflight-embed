import type { ResolvedToken } from "../types/api";

const CACHE_PREFIX = "tf:token:";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CachedToken {
  token: ResolvedToken;
  timestamp: number;
}

function getCacheKey(chainId: number, address: string): string {
  return `${CACHE_PREFIX}${chainId}:${address.toLowerCase()}`;
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
  apiEndpoint?: string
): Promise<ResolvedToken> {
  const cached = getCachedToken(chainId, address);
  if (cached) return cached;

  if (apiEndpoint) {
    try {
      const response = await fetch(
        `${apiEndpoint}/tokens/${chainId}/${address}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (response.ok) {
        const data = (await response.json()) as ResolvedToken;
        const resolved: ResolvedToken = {
          chainId: data.chainId ?? chainId,
          address: data.address ?? address,
          symbol: data.symbol,
          name: data.name,
          decimals: data.decimals,
          logoURI: data.logoURI,
        };
        setCachedToken(resolved);
        return resolved;
      }
    } catch {
      // Fall through to basic token
    }
  }

  return { chainId, address };
}
