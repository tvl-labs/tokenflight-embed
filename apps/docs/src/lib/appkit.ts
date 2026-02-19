/**
 * AppKit singleton initialisation — SSR-safe via dynamic imports.
 *
 * Everything heavy (@reown/appkit, wagmi, viem, solana adapter) is loaded lazily
 * the first time `getWalletAdapter()` is called in the browser. Subsequent calls
 * return the cached singleton immediately.
 */

let adapter: Awaited<ReturnType<typeof initAdapter>> | undefined;

/** Cached AppKit instance for theme sync */
let appkitInstance: { setThemeMode(mode: 'light' | 'dark'): void } | undefined;

export async function getWalletAdapter() {
  if (typeof window === 'undefined') return undefined;
  if (adapter) return adapter;

  adapter = await initAdapter();
  return adapter;
}

/** Detect page theme from Starlight's data-theme attribute */
function getPageTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Sync AppKit modal theme with the current page theme */
export function syncAppKitTheme() {
  appkitInstance?.setThemeMode(getPageTheme());
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
    themeMode: getPageTheme(),
    features: {
      analytics: true,
      email: false,
      socials: false,
      swaps: false,
      history: false,
      onramp: false,
      send: false,
      receive: false,
    },
  });

  appkitInstance = appkit;

  return new AppKitWalletAdapter(appkit);
}
