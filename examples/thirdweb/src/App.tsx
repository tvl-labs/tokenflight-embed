import { useEffect, useMemo, useState } from "react";
import { TokenFlightSwap } from "@tokenflight/swap";
import { ThirdwebWalletAdapter } from "@tokenflight/adapter-thirdweb";

export default function App() {
  const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID as string | undefined;
  const [walletAdapter, setWalletAdapter] = useState<ThirdwebWalletAdapter | null>(null);

  useEffect(() => {
    if (!clientId) return;

    let mounted = true;

    const init = async () => {
      const [{ createThirdwebClient }, { connect, inAppWallet }, { base }] = await Promise.all([
        import("thirdweb"),
        import("thirdweb/wallets"),
        import("thirdweb/chains"),
      ]);

      if (!mounted) return;

      const client = createThirdwebClient({ clientId });
      setWalletAdapter(
        new ThirdwebWalletAdapter(
          { connect },
          {
            client,
            chain: base,
            wallets: [inAppWallet()],
          },
        ),
      );
    };

    void init();

    return () => {
      mounted = false;
    };
  }, [clientId]);

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

  if (!clientId) {
    return (
      <main>
        <h1>TokenFlight + thirdweb</h1>
        <p>Set <code>VITE_THIRDWEB_CLIENT_ID</code> to run this example.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>TokenFlight + thirdweb</h1>
      <p>Use a thirdweb wallet and pass the adapter into TokenFlight.</p>
      <div className="notice">This demo uses <code>@tokenflight/adapter-thirdweb</code>.</div>
      <div id="swap-widget" />
    </main>
  );
}
