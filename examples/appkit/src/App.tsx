import { useEffect, useMemo } from "react";
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, mainnet } from "@reown/appkit/networks";
import { TokenFlightSwap } from "@tokenflight/swap";
import { AppKitWalletAdapter } from "@tokenflight/adapter-appkit";

function createAdapter(projectId: string) {
  const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks: [mainnet, base] as any,
  });

  const appkit = createAppKit({
    adapters: [wagmiAdapter],
    networks: [mainnet, base] as any,
    projectId,
    metadata: {
      name: "TokenFlight Example",
      description: "TokenFlight + AppKit",
      url: window.location.origin,
      icons: [],
    },
    features: {
      analytics: false,
      swaps: false,
      onramp: false,
      socials: false,
      email: false,
      history: false,
      send: false,
      receive: false,
    },
  });

  return new AppKitWalletAdapter(appkit);
}

export default function App() {
  const projectId = import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined;

  const walletAdapter = useMemo(
    () => (projectId ? createAdapter(projectId) : null),
    [projectId],
  );

  useEffect(() => {
    if (!walletAdapter) return;

    const swap = new TokenFlightSwap({
      container: "#swap-widget",
      config: {
        theme: "light",
        fromToken: {
          chainId: 1,
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        },
        toToken: {
          chainId: 8453,
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        },
      },
      walletAdapter,
    });

    swap.initialize();
    return () => swap.destroy();
  }, [walletAdapter]);

  if (!projectId) {
    return (
      <main>
        <h1>TokenFlight + AppKit</h1>
        <p>Set <code>VITE_REOWN_PROJECT_ID</code> to run this example.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>TokenFlight + AppKit</h1>
      <p>Use Reown AppKit for wallet connection and chain switching.</p>
      <div className="notice">This demo uses <code>@tokenflight/adapter-appkit</code>.</div>
      <div id="swap-widget" />
    </main>
  );
}
