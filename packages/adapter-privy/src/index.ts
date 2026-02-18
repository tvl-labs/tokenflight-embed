import type {
  IWalletAdapter,
  ChainType,
  WalletAction,
  WalletActionResult,
  WalletActionType,
  WalletEvent,
  WalletEventType,
} from "@tokenflight/swap";

interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

interface PrivyClient {
  login(): Promise<void>;
  logout(): Promise<void>;
  authenticated: boolean;
  user?: {
    wallet?: {
      address: string;
      chainType: string;
    };
  };
}

interface PrivyEmbeddedWallet {
  address: string;
  getEthereumProvider(): Promise<EIP1193Provider>;
}

export class PrivyWalletAdapter implements IWalletAdapter {
  readonly name = "Privy";
  readonly icon = undefined;
  readonly supportedActionTypes: WalletActionType[] = ["eip1193_request"];

  private privy: PrivyClient;
  private wallets: PrivyEmbeddedWallet[];
  private listeners = new Map<WalletEventType, Set<(event: WalletEvent) => void>>();

  constructor(privyClient: PrivyClient, wallets?: PrivyEmbeddedWallet[]) {
    this.privy = privyClient;
    this.wallets = wallets ?? [];
  }

  async connect(_ct?: ChainType): Promise<void> {
    if (!this.privy.authenticated) {
      await this.privy.login();
    }
    this.emit("connect", { address: this.privy.user?.wallet?.address });
  }

  async disconnect(): Promise<void> {
    await this.privy.logout();
    this.emit("disconnect");
  }

  isConnected(_ct?: ChainType): boolean {
    return this.privy.authenticated;
  }

  async getAddress(_ct?: ChainType): Promise<string | null> {
    return this.privy.user?.wallet?.address ?? null;
  }

  async executeWalletAction(action: WalletAction): Promise<WalletActionResult> {
    if (action.type !== "eip1193_request") {
      return { success: false, error: `Unsupported action type: ${action.type}` };
    }

    try {
      const wallet = this.wallets[0];
      if (!wallet) {
        return { success: false, error: "No embedded wallet available" };
      }

      const provider = await wallet.getEthereumProvider();
      const result = await provider.request({
        method: action.method,
        params: action.params,
      });

      return {
        success: true,
        data: result,
        txHash: typeof result === "string" ? result : undefined,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
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

  private emit(type: WalletEventType, data?: unknown): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      for (const handler of handlers) {
        handler({ type, data });
      }
    }
  }
}
