import { useEffect, useMemo } from "react";
import { createConfig, http } from "@wagmi/core";
import { mainnet, base } from "@wagmi/core/chains";
import { injected } from "wagmi/connectors";
import { TokenFlightSwap } from "@tokenflight/swap";
import { WagmiWalletAdapter } from "@tokenflight/adapter-wagmi";

const wagmiConfig = createConfig({
  chains: [mainnet, base],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});

export default function App() {
  const walletAdapter = useMemo(() => new WagmiWalletAdapter(wagmiConfig), []);

  useEffect(() => {
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

  return (
    <main>
      <h1>TokenFlight + wagmi</h1>
      <p>Use wagmi connectors with TokenFlight wallet actions.</p>
      <div className="notice">This demo uses <code>@tokenflight/adapter-wagmi</code>.</div>
      <div id="swap-widget" />
    </main>
  );
}
