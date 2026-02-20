import type { Config, Connector } from "@wagmi/core";
import { connect, disconnect, getConnection, switchChain, watchConnection } from "@wagmi/core/actions";

type ChainType = "evm" | "solana";

interface EvmWalletAction {
  type: "eip1193_request";
  chainId: number;
  method: string;
  params: unknown[];
}

interface SolanaSignTransactionAction {
  type: "solana_signTransaction";
  transaction: string;
}

interface SolanaSignAndSendAction {
  type: "solana_signAndSendTransaction";
  transaction: string;
}

type WalletAction = EvmWalletAction | SolanaSignTransactionAction | SolanaSignAndSendAction;

type WalletActionType = "eip1193_request" | "solana_signTransaction" | "solana_signAndSendTransaction";

interface WalletActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  txHash?: string;
}

type WalletEventType = "connect" | "disconnect" | "chainChanged" | "accountsChanged";

interface WalletEvent {
  type: WalletEventType;
  data?: unknown;
}

interface IWalletAdapter {
  readonly name: string;
  readonly icon?: string;
  readonly supportedActionTypes: WalletActionType[];
  connect(chainType?: ChainType): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(chainType?: ChainType): boolean;
  getAddress(chainType?: ChainType): Promise<string | null>;
  executeWalletAction(action: WalletAction): Promise<WalletActionResult>;
  signMessage?(message: string, chainType?: ChainType): Promise<string>;
  openAccountModal?(): Promise<void>;
  on(event: WalletEventType, handler: (event: WalletEvent) => void): void;
  off(event: WalletEventType, handler: (event: WalletEvent) => void): void;
}

interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

export interface WagmiWalletAdapterOptions {
  connector?: Connector;
  autoSwitchChain?: boolean;
}

export class WagmiWalletAdapter implements IWalletAdapter {
  readonly name = "wagmi";
  readonly icon = undefined;
  readonly supportedActionTypes: WalletActionType[] = ["eip1193_request"];

  private listeners = new Map<WalletEventType, Set<(event: WalletEvent) => void>>();
  private stopWatchingConnection: (() => void) | null = null;

  constructor(
    private readonly wagmiConfig: Config,
    private readonly options: WagmiWalletAdapterOptions = {},
  ) {
    this.stopWatchingConnection = watchConnection(this.wagmiConfig, {
      onChange: (connection, previousConnection) => {
        if (connection.isConnected && !previousConnection.isConnected) {
          this.emit("connect", { address: connection.address });
        }

        if (!connection.isConnected && previousConnection.isConnected) {
          this.emit("disconnect");
        }

        if (connection.chainId !== previousConnection.chainId && connection.chainId) {
          this.emit("chainChanged", { chainId: connection.chainId });
        }

        const nextAddresses = connection.addresses ?? [];
        const prevAddresses = previousConnection.addresses ?? [];
        if (!this.sameAddresses(nextAddresses, prevAddresses) && nextAddresses.length > 0) {
          this.emit("accountsChanged", { addresses: nextAddresses, address: nextAddresses[0] });
        }
      },
    });
  }

  async connect(chainType?: ChainType): Promise<void> {
    if (chainType && chainType !== "evm") {
      throw new Error(`Unsupported chain type for wagmi adapter: ${chainType}`);
    }

    if (this.isConnected("evm")) return;

    const connector = this.options.connector ?? this.wagmiConfig.connectors[0];
    if (!connector) {
      throw new Error("No wagmi connector configured");
    }

    await connect(this.wagmiConfig, { connector });
  }

  async disconnect(): Promise<void> {
    const connection = getConnection(this.wagmiConfig);

    if (connection.connector) {
      await disconnect(this.wagmiConfig, { connector: connection.connector });
      return;
    }

    const fallbackConnector = this.options.connector ?? this.wagmiConfig.connectors[0];
    if (fallbackConnector) {
      await disconnect(this.wagmiConfig, { connector: fallbackConnector });
    }
  }

  isConnected(chainType?: ChainType): boolean {
    if (chainType && chainType !== "evm") return false;
    return getConnection(this.wagmiConfig).isConnected;
  }

  async getAddress(chainType?: ChainType): Promise<string | null> {
    if (chainType && chainType !== "evm") return null;
    const connection = getConnection(this.wagmiConfig);
    return connection.isConnected ? connection.address ?? null : null;
  }

  async executeWalletAction(action: WalletAction): Promise<WalletActionResult> {
    if (action.type !== "eip1193_request") {
      return { success: false, error: `Unsupported action type: ${action.type}` };
    }

    try {
      const provider = await this.getProvider(action.chainId);
      const result = await provider.request({
        method: action.method,
        params: action.params,
      });

      return {
        success: true,
        data: result,
        txHash: this.extractTxHash(result),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async signMessage(message: string, chainType?: ChainType): Promise<string> {
    if (chainType && chainType !== "evm") {
      throw new Error(`Unsupported chain type for signMessage: ${chainType}`);
    }

    const provider = await this.getProvider();
    let address = await this.getAddress("evm");
    if (!address) {
      await this.connect("evm");
      address = await this.getAddress("evm");
    }
    if (!address) {
      throw new Error("Wallet is not connected");
    }

    try {
      const result = await provider.request({
        method: "personal_sign",
        params: [message, address],
      });
      if (typeof result !== "string") throw new Error("Invalid personal_sign response");
      return result;
    } catch {
      const fallback = await provider.request({
        method: "personal_sign",
        params: [address, message],
      });
      if (typeof fallback !== "string") throw new Error("Invalid personal_sign response");
      return fallback;
    }
  }

  on(event: WalletEventType, handler: (event: WalletEvent) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: WalletEventType, handler: (event: WalletEvent) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  destroy(): void {
    this.stopWatchingConnection?.();
    this.stopWatchingConnection = null;
    this.listeners.clear();
  }

  private async getProvider(chainId?: number): Promise<EIP1193Provider> {
    const connection = getConnection(this.wagmiConfig);
    const connector = connection.connector ?? this.options.connector ?? this.wagmiConfig.connectors[0];

    if (!connector) {
      throw new Error("No wagmi connector available");
    }

    if (
      chainId &&
      this.options.autoSwitchChain !== false &&
      connection.isConnected &&
      connection.chainId !== chainId &&
      connector.switchChain
    ) {
      await switchChain(this.wagmiConfig, {
        chainId: chainId as any,
        connector,
      } as any);
    }

    const provider = await connector.getProvider(chainId ? { chainId } : undefined);
    if (!this.isEip1193Provider(provider)) {
      throw new Error("Connected provider does not implement EIP-1193 request()");
    }

    return provider;
  }

  private extractTxHash(result: unknown): string | undefined {
    if (typeof result === "string") return result;

    if (result && typeof result === "object") {
      const candidate = result as { hash?: unknown; transactionHash?: unknown };
      if (typeof candidate.hash === "string") return candidate.hash;
      if (typeof candidate.transactionHash === "string") return candidate.transactionHash;
    }

    return undefined;
  }

  private sameAddresses(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private isEip1193Provider(value: unknown): value is EIP1193Provider {
    return !!value && typeof value === "object" && typeof (value as EIP1193Provider).request === "function";
  }

  private emit(type: WalletEventType, data?: unknown): void {
    const handlers = this.listeners.get(type);
    if (!handlers) return;
    for (const handler of handlers) {
      handler({ type, data });
    }
  }
}

export { WagmiWalletAdapter as WagmiAdapter };
