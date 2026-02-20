import { useEffect, useMemo } from "react";
import { TokenFlightSwap } from "@tokenflight/swap";
import { EthersWalletAdapter } from "@tokenflight/adapter-ethers";

declare global {
  interface Window {
    ethereum?: {
      request(args: { method: string; params?: unknown[] }): Promise<unknown>;
      on?(event: string, listener: (...args: unknown[]) => void): void;
      removeListener?(event: string, listener: (...args: unknown[]) => void): void;
    };
  }
}

export default function App() {
  const walletAdapter = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new EthersWalletAdapter(window.ethereum);
  }, []);

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

  if (!walletAdapter) {
    return (
      <main>
        <h1>TokenFlight + ethers</h1>
        <p>Install MetaMask (or another injected wallet) to run this example.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>TokenFlight + ethers</h1>
      <p>Use an EIP-1193 wallet provider through ethers.</p>
      <div className="notice">This demo uses <code>@tokenflight/adapter-ethers</code>.</div>
      <div id="swap-widget" />
    </main>
  );
}
