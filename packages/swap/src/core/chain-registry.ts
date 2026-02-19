import type { HyperstreamApi } from "./hyperstream-api";

export interface ChainDisplay {
  chainId: number;
  name: string;
}

const FALLBACK_CHAINS: ChainDisplay[] = [
  { chainId: 1, name: "Ethereum" },
  { chainId: 8453, name: "Base" },
  { chainId: 42161, name: "Arbitrum" },
  { chainId: 10, name: "Optimism" },
  { chainId: 137, name: "Polygon" },
  { chainId: 20011000000, name: "Solana" },
];

let cachedChains: ChainDisplay[] | null = null;
let chainMap: Map<number, ChainDisplay> | null = null;
let loadPromise: Promise<void> | null = null;

function buildMap(chains: ChainDisplay[]) {
  chainMap = new Map(chains.map((c) => [c.chainId, c]));
}

// Initialize with fallback
buildMap(FALLBACK_CHAINS);

/** Load chains from /v1/chains and cache the result */
export async function loadChains(client: HyperstreamApi): Promise<ChainDisplay[]> {
  if (cachedChains) return cachedChains;

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const raw = await client.getChains();
        cachedChains = raw.map((c) => ({
          chainId: c.chainId,
          name: c.name,
        }));
        buildMap(cachedChains);
      } catch {
        cachedChains = FALLBACK_CHAINS;
      }
    })();
  }

  await loadPromise;
  return cachedChains!;
}

/** Get chain display info by chainId. Uses cached API data or fallback. */
export function getChainDisplay(chainId: number): ChainDisplay | undefined {
  return chainMap?.get(chainId);
}
