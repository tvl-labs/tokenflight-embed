/**
 * AppKit singleton initialisation — SSR-safe via dynamic imports.
 *
 * Everything heavy (@reown/appkit, wagmi, viem, solana adapter) is loaded lazily
 * the first time `getWalletAdapter()` is called in the browser. Subsequent calls
 * return the cached singleton immediately.
 */

let adapter: Awaited<ReturnType<typeof initAdapter>> | undefined;

export async function getWalletAdapter() {
  if (typeof window === 'undefined') return undefined;
  if (adapter) return adapter;

  adapter = await initAdapter();
  return adapter;
}

async function initAdapter() {
  const projectId = import.meta.env.PUBLIC_REOWN_PROJECT_ID as string | undefined;
  if (!projectId) {
    console.warn('[TokenFlight] PUBLIC_REOWN_PROJECT_ID not set — wallet connection disabled');
    return undefined;
  }

  const [
    { createAppKit },
    { WagmiAdapter },
    { SolanaAdapter },
    appkitNetworks,
    { AppKitWalletAdapter },
  ] = await Promise.all([
    import('@reown/appkit'),
    import('@reown/appkit-adapter-wagmi'),
    import('@reown/appkit-adapter-solana'),
    import('@reown/appkit/networks'),
    import('@tokenflight/adapter-appkit'),
  ]);

  const networks = [
    appkitNetworks.mainnet,
    appkitNetworks.arbitrum,
    appkitNetworks.base,
    appkitNetworks.polygon,
    appkitNetworks.optimism,
    appkitNetworks.solana,
  ] as const;

  const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks: networks as any,
  });

  const solanaAdapter = new SolanaAdapter();

  const appkit = createAppKit({
    adapters: [wagmiAdapter, solanaAdapter],
    networks: networks as any,
    projectId,
    metadata: {
      name: 'TokenFlight',
      description: 'Cross-chain token swaps',
      url: window.location.origin,
      icons: [],
    },
  });

  return new AppKitWalletAdapter(appkit);
}
