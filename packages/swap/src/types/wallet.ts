/** Chain type for multi-chain support */
export type ChainType = "evm" | "solana";

/** EVM wallet action via EIP-1193 */
export interface EvmWalletAction {
  type: "eip1193_request";
  chainId: number;
  method: string;
  params: unknown[];
}

/** Solana sign transaction action */
export interface SolanaSignTransactionAction {
  type: "solana_signTransaction";
  transaction: string;
}

/** Solana sign and send transaction action */
export interface SolanaSignAndSendAction {
  type: "solana_signAndSendTransaction";
  transaction: string;
}

/** Union of all wallet action types */
export type WalletAction =
  | EvmWalletAction
  | SolanaSignTransactionAction
  | SolanaSignAndSendAction;

/** Wallet action types */
export type WalletActionType =
  | "eip1193_request"
  | "solana_signTransaction"
  | "solana_signAndSendTransaction";

/** Result of executing a wallet action */
export interface WalletActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  txHash?: string;
}

/** Wallet event types */
export type WalletEventType =
  | "connect"
  | "disconnect"
  | "chainChanged"
  | "accountsChanged";

/** Wallet event payload */
export interface WalletEvent {
  type: WalletEventType;
  data?: unknown;
}

/** Wallet adapter interface that all adapters must implement */
export interface IWalletAdapter {
  /** Human-readable name */
  readonly name: string;
  /** Icon URL */
  readonly icon?: string;
  /** Supported action types */
  readonly supportedActionTypes: WalletActionType[];
  /** Connect the wallet */
  connect(chainType?: ChainType): Promise<void>;
  /** Disconnect the wallet */
  disconnect(): Promise<void>;
  /** Check if connected */
  isConnected(chainType?: ChainType): boolean;
  /** Get the current address */
  getAddress(chainType?: ChainType): Promise<string | null>;
  /** Execute a wallet action */
  executeWalletAction(action: WalletAction): Promise<WalletActionResult>;
  /** Optional: sign a message */
  signMessage?(message: string, chainType?: ChainType): Promise<string>;
  /** Optional: open the wallet's native account/connected modal */
  openAccountModal?(): Promise<void>;
  /** Subscribe to wallet events */
  on(event: WalletEventType, handler: (event: WalletEvent) => void): void;
  /** Unsubscribe from wallet events */
  off(event: WalletEventType, handler: (event: WalletEvent) => void): void;
}
