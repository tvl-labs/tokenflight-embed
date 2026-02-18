import type {
  IWalletAdapter,
  ChainType,
  WalletAction,
  WalletActionResult,
  WalletActionType,
  WalletEvent,
  WalletEventType,
} from "../types/wallet";

export class MockWalletAdapter implements IWalletAdapter {
  readonly name = "Mock Wallet";
  readonly icon = undefined;
  readonly supportedActionTypes: WalletActionType[] = [
    "eip1193_request",
    "solana_signAndSendTransaction",
  ];

  private connected = false;
  private address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  private listeners = new Map<WalletEventType, Set<(event: WalletEvent) => void>>();

  async connect(_chainType?: ChainType): Promise<void> {
    this.connected = true;
    this.emit("connect", { address: this.address });
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.emit("disconnect");
  }

  isConnected(_chainType?: ChainType): boolean {
    return this.connected;
  }

  async getAddress(_chainType?: ChainType): Promise<string | null> {
    return this.connected ? this.address : null;
  }

  async executeWalletAction(action: WalletAction): Promise<WalletActionResult> {
    // Simulate a delay
    await new Promise((r) => setTimeout(r, 1000));

    return {
      success: true,
      txHash: "0x" + "a".repeat(64),
    };
  }

  async signMessage(message: string): Promise<string> {
    return "0x" + "b".repeat(130);
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
