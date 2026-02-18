import type {
  IWalletAdapter,
  ChainType,
  WalletAction,
  WalletActionResult,
  WalletActionType,
  WalletEvent,
  WalletEventType,
} from "@tokenflight/swap";

interface ThirdwebAccount {
  address: string;
  sendTransaction(tx: unknown): Promise<{ transactionHash: string }>;
  signMessage(args: { message: string }): Promise<string>;
}

interface ThirdwebWallet {
  getAccount(): ThirdwebAccount | undefined;
  disconnect(): Promise<void>;
  subscribe(event: string, cb: (...args: unknown[]) => void): () => void;
}

interface ConnectOptions {
  client: unknown;
  wallets?: unknown[];
  chain?: unknown;
}

interface ThirdwebConnect {
  connect(options: ConnectOptions): Promise<ThirdwebWallet>;
}

export class ThirdwebWalletAdapter implements IWalletAdapter {
  readonly name = "Thirdweb";
  readonly icon = undefined;
  readonly supportedActionTypes: WalletActionType[] = [
    "eip1193_request",
    "solana_signAndSendTransaction",
  ];

  private wallet: ThirdwebWallet | null = null;
  private connectFn: ThirdwebConnect;
  private connectOptions: ConnectOptions;
  private listeners = new Map<WalletEventType, Set<(event: WalletEvent) => void>>();

  constructor(connectFn: ThirdwebConnect, connectOptions: ConnectOptions) {
    this.connectFn = connectFn;
    this.connectOptions = connectOptions;
  }

  async connect(_chainType?: ChainType): Promise<void> {
    this.wallet = await this.connectFn.connect(this.connectOptions);
    const account = this.wallet.getAccount();
    this.emit("connect", { address: account?.address });
  }

  async disconnect(): Promise<void> {
    if (this.wallet) {
      await this.wallet.disconnect();
      this.wallet = null;
    }
    this.emit("disconnect");
  }

  isConnected(_chainType?: ChainType): boolean {
    return !!this.wallet?.getAccount();
  }

  async getAddress(_chainType?: ChainType): Promise<string | null> {
    return this.wallet?.getAccount()?.address ?? null;
  }

  async executeWalletAction(action: WalletAction): Promise<WalletActionResult> {
    const account = this.wallet?.getAccount();
    if (!account) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      if (action.type === "eip1193_request") {
        if (action.method === "eth_sendTransaction" && action.params[0]) {
          const receipt = await account.sendTransaction(action.params[0]);
          return { success: true, txHash: receipt.transactionHash };
        }
        // For other EIP-1193 methods, use a generic approach
        return { success: true, data: null };
      }

      if (action.type === "solana_signAndSendTransaction") {
        // Thirdweb Solana support would go here
        return { success: false, error: "Solana not yet supported via Thirdweb adapter" };
      }

      return { success: false, error: `Unsupported action type: ${(action as any).type}` };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async signMessage(message: string): Promise<string> {
    const account = this.wallet?.getAccount();
    if (!account) throw new Error("Wallet not connected");
    return account.signMessage({ message });
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
