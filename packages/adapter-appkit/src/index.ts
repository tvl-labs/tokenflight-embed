import type { AppKit } from "@reown/appkit";
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

export class AppKitWalletAdapter implements IWalletAdapter {
  readonly name = "AppKit";
  readonly icon = undefined;
  readonly supportedActionTypes: WalletActionType[] = [
    "eip1193_request",
    "solana_signAndSendTransaction",
  ];

  private appkit: AppKit;
  private listeners = new Map<WalletEventType, Set<(event: WalletEvent) => void>>();
  private unsubscribes: (() => void)[] = [];

  constructor(appkit: AppKit) {
    this.appkit = appkit;

    this.unsubscribes.push(
      appkit.subscribeAccount((account) => {
        if (account.isConnected) {
          this.emit("connect", { address: account.address });
        } else {
          this.emit("disconnect");
        }
      }),
    );

    this.unsubscribes.push(
      appkit.subscribeNetwork((network) => {
        if (network.chainId) {
          this.emit("chainChanged", { chainId: network.chainId });
        }
      }),
    );
  }

  async connect(_chainType?: ChainType): Promise<void> {
    await this.appkit.open();
  }

  async disconnect(): Promise<void> {
    await this.appkit.disconnect();
    this.emit("disconnect");
  }

  isConnected(_chainType?: ChainType): boolean {
    return this.appkit.getIsConnectedState();
  }

  async getAddress(_chainType?: ChainType): Promise<string | null> {
    return this.appkit.getAddress() ?? null;
  }

  async executeWalletAction(action: WalletAction): Promise<WalletActionResult> {
    try {
      if (action.type === "eip1193_request") {
        const provider = this.appkit.getProvider<EIP1193Provider>("eip155");
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
        const provider = this.appkit.getProvider<EIP1193Provider>("solana");
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

  async openAccountModal(): Promise<void> {
    await this.appkit.open({ view: "Account" });
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

  /** Clean up subscriptions to prevent memory leaks. */
  destroy(): void {
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes = [];
    this.listeners.clear();
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
