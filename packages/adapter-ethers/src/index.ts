import { BrowserProvider, type Signer } from "ethers";

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

interface EIP1193EventProvider extends EIP1193Provider {
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export interface EthersWalletAdapterOptions {
  autoSwitchChain?: boolean;
}

export class EthersWalletAdapter implements IWalletAdapter {
  readonly name = "ethers";
  readonly icon = undefined;
  readonly supportedActionTypes: WalletActionType[] = ["eip1193_request"];

  private provider: BrowserProvider | null = null;
  private signer: Signer | null = null;
  private address: string | null = null;
  private listeners = new Map<WalletEventType, Set<(event: WalletEvent) => void>>();

  private readonly handleAccountsChanged = (accounts: unknown) => {
    if (!Array.isArray(accounts)) return;
    const addresses = accounts.filter((item): item is string => typeof item === "string");
    this.address = addresses[0] ?? null;
    this.emit("accountsChanged", { addresses, address: this.address });
    if (this.address) {
      this.emit("connect", { address: this.address });
    } else {
      this.emit("disconnect");
    }
  };

  private readonly handleChainChanged = (chainIdHex: unknown) => {
    if (typeof chainIdHex !== "string") return;
    const chainId = Number.parseInt(chainIdHex, 16);
    if (!Number.isNaN(chainId)) {
      this.emit("chainChanged", { chainId });
    }
  };

  constructor(
    private readonly ethereum: EIP1193EventProvider,
    private readonly options: EthersWalletAdapterOptions = {},
  ) {
    this.ethereum.on?.("accountsChanged", this.handleAccountsChanged);
    this.ethereum.on?.("chainChanged", this.handleChainChanged);
  }

  async connect(chainType?: ChainType): Promise<void> {
    if (chainType && chainType !== "evm") {
      throw new Error(`Unsupported chain type for ethers adapter: ${chainType}`);
    }

    this.provider = new BrowserProvider(this.ethereum);
    await this.ethereum.request({ method: "eth_requestAccounts" });
    this.signer = await this.provider.getSigner();
    this.address = await this.signer.getAddress();
    this.emit("connect", { address: this.address });
  }

  async disconnect(): Promise<void> {
    this.address = null;
    this.signer = null;
    this.provider = null;
    this.emit("disconnect");
  }

  isConnected(chainType?: ChainType): boolean {
    if (chainType && chainType !== "evm") return false;
    return this.address !== null;
  }

  async getAddress(chainType?: ChainType): Promise<string | null> {
    if (chainType && chainType !== "evm") return null;
    return this.address;
  }

  async executeWalletAction(action: WalletAction): Promise<WalletActionResult> {
    if (action.type !== "eip1193_request") {
      return { success: false, error: `Unsupported action type: ${action.type}` };
    }

    try {
      if (this.options.autoSwitchChain !== false) {
        await this.ensureChain(action.chainId);
      }

      const result = await this.ethereum.request({
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

    if (!this.signer) {
      await this.connect("evm");
    }

    if (!this.signer) {
      throw new Error("Wallet signer unavailable");
    }

    return this.signer.signMessage(message);
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
    this.ethereum.removeListener?.("accountsChanged", this.handleAccountsChanged);
    this.ethereum.removeListener?.("chainChanged", this.handleChainChanged);
    this.listeners.clear();
  }

  private async ensureChain(targetChainId: number): Promise<void> {
    const chainIdHex = await this.ethereum.request({ method: "eth_chainId" });
    if (typeof chainIdHex !== "string") return;

    const currentChainId = Number.parseInt(chainIdHex, 16);
    if (currentChainId === targetChainId) return;

    await this.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${targetChainId.toString(16)}` }],
    });
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

  private emit(type: WalletEventType, data?: unknown): void {
    const handlers = this.listeners.get(type);
    if (!handlers) return;
    for (const handler of handlers) {
      handler({ type, data });
    }
  }
}

export { EthersWalletAdapter as EthersAdapter };
