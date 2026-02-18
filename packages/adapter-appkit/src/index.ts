import type {
  IWalletAdapter,
  ChainType,
  WalletAction,
  WalletActionResult,
  WalletActionType,
  WalletEvent,
  WalletEventType,
} from "@tokenflight/swap";

interface AppKitModal {
  open(): Promise<void>;
  close(): void;
}

interface AppKitProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

interface AppKitState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
}

interface AppKitClient {
  modal: AppKitModal;
  getState(): AppKitState;
  getProvider(chainType: "eip155" | "solana"): AppKitProvider | undefined;
  disconnect(): Promise<void>;
  subscribeState(cb: (state: AppKitState) => void): () => void;
}

export class AppKitWalletAdapter implements IWalletAdapter {
  readonly name = "AppKit";
  readonly icon = undefined;
  readonly supportedActionTypes: WalletActionType[] = [
    "eip1193_request",
    "solana_signAndSendTransaction",
  ];

  private appkit: AppKitClient;
  private listeners = new Map<WalletEventType, Set<(event: WalletEvent) => void>>();
  private unsubscribe: (() => void) | null = null;

  constructor(appkitClient: AppKitClient) {
    this.appkit = appkitClient;
    this.unsubscribe = appkitClient.subscribeState((state) => {
      if (state.isConnected) {
        this.emit("connect", { address: state.address });
      } else {
        this.emit("disconnect");
      }
      if (state.chainId) {
        this.emit("chainChanged", { chainId: state.chainId });
      }
    });
  }

  async connect(_chainType?: ChainType): Promise<void> {
    await this.appkit.modal.open();
  }

  async disconnect(): Promise<void> {
    await this.appkit.disconnect();
    this.emit("disconnect");
  }

  isConnected(_chainType?: ChainType): boolean {
    return this.appkit.getState().isConnected;
  }

  async getAddress(_chainType?: ChainType): Promise<string | null> {
    return this.appkit.getState().address ?? null;
  }

  async executeWalletAction(action: WalletAction): Promise<WalletActionResult> {
    try {
      if (action.type === "eip1193_request") {
        const provider = this.appkit.getProvider("eip155");
        if (!provider) {
          return { success: false, error: "EVM provider not available" };
        }
        const result = await provider.request({
          method: action.method,
          params: action.params,
        });
        return {
          success: true,
          data: result,
          txHash: typeof result === "string" ? result : undefined,
        };
      }

      if (action.type === "solana_signAndSendTransaction") {
        const provider = this.appkit.getProvider("solana");
        if (!provider) {
          return { success: false, error: "Solana provider not available" };
        }
        const result = await provider.request({
          method: "signAndSendTransaction",
          params: [action.transaction],
        });
        return {
          success: true,
          data: result,
          txHash: typeof result === "string" ? result : undefined,
        };
      }

      return { success: false, error: `Unsupported action type: ${(action as any).type}` };
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
