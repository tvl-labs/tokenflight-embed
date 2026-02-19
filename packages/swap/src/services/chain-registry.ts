import { createSignal } from "solid-js";
import type { HyperstreamApi } from "../api/hyperstream-api";

export interface ChainDisplay {
  chainId: number;
  name: string;
}

const FALLBACK_CHAINS: ChainDisplay[] = [
  { chainId: 1, name: "Ethereum" },
  { chainId: 10, name: "Optimism" },
  { chainId: 56, name: "BNB Chain" },
  { chainId: 137, name: "Polygon" },
  { chainId: 324, name: "zkSync" },
  { chainId: 8453, name: "Base" },
  { chainId: 42161, name: "Arbitrum" },
  { chainId: 43114, name: "Avalanche" },
  { chainId: 59144, name: "Linea" },
  { chainId: 5000, name: "Mantle" },
  { chainId: 80094, name: "Berachain" },
  { chainId: 1301, name: "Unichain" },
  { chainId: 2741, name: "Abstract" },
  { chainId: 10143, name: "Monad" },
  { chainId: 20011000000, name: "Solana" },
];

let cachedChains: ChainDisplay[] | null = null;
let loadPromise: Promise<void> | null = null;

const [chainMap, setChainMap] = createSignal<Map<number, ChainDisplay>>(
  new Map(FALLBACK_CHAINS.map((c) => [c.chainId, c])),
);

function buildMap(chains: ChainDisplay[]) {
  setChainMap(new Map(chains.map((c) => [c.chainId, c])));
}

function normalizeChainId(chainId: number | string | null | undefined): number | null {
  if (typeof chainId === "number") {
    return Number.isFinite(chainId) ? chainId : null;
  }
  if (typeof chainId === "string" && chainId.trim()) {
    const parsed = Number(chainId);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Load chains from /v1/chains and cache the result */
export async function loadChains(client: HyperstreamApi): Promise<ChainDisplay[]> {
  if (cachedChains) return cachedChains;

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const raw = await client.getChains();
        const normalized = raw
          .map((c) => ({
            chainId: normalizeChainId(c.chainId),
            name: typeof c.name === "string" ? c.name.trim() : "",
          }))
          .filter((c): c is { chainId: number; name: string } => !!c.chainId && !!c.name);

        cachedChains = normalized.length > 0 ? normalized : FALLBACK_CHAINS;
        buildMap(cachedChains);
      } catch {
        cachedChains = FALLBACK_CHAINS;
      }
    })();
  }

  await loadPromise;
  return cachedChains!;
}

/** Get chain display info by chainId. Reactive — re-triggers memos when chains load. */
export function getChainDisplay(chainId: number | string): ChainDisplay | undefined {
  const normalized = normalizeChainId(chainId);
  if (normalized === null) return undefined;
  return chainMap().get(normalized);
}
