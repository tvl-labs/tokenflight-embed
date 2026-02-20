import { useEffect, useMemo } from "react";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { TokenFlightSwap } from "@tokenflight/swap";
import { PrivyWalletAdapter } from "@tokenflight/adapter-privy";

function PrivySwap() {
  const { authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  const walletAdapter = useMemo(
    () =>
      new PrivyWalletAdapter(
        {
          authenticated,
          login,
          logout,
          user: user?.wallet
            ? {
                wallet: {
                  address: user.wallet.address,
                  chainType: "ethereum",
                },
              }
            : undefined,
        } as any,
        wallets as any,
      ),
    [authenticated, login, logout, user, wallets],
  );

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

  return <div id="swap-widget" />;
}

export default function App() {
  const appId = import.meta.env.VITE_PRIVY_APP_ID;

  if (!appId) {
    return (
      <main>
        <h1>TokenFlight + Privy</h1>
        <p>Set <code>VITE_PRIVY_APP_ID</code> to run this example.</p>
      </main>
    );
  }

  return (
    <PrivyProvider appId={appId}>
      <main>
        <h1>TokenFlight + Privy</h1>
        <p>Connect with Privy, then run a cross-chain swap.</p>
        <div className="notice">This demo uses <code>@tokenflight/adapter-privy</code>.</div>
        <PrivySwap />
      </main>
    </PrivyProvider>
  );
}
