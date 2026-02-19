import type { QuoteResponse } from "./api";
import type { IWalletAdapter } from "./wallet";

/** Token target as chain + address pair */
export interface TokenTarget {
  chainId: number;
  address: string;
}

/**
 * Flexible token identifier supporting:
 * - Direct object: { chainId: 1, address: "0x..." }
 * - CAIP-10 string: "eip155:1:0x..."
 * - JSON string: '{"chainId":1,"address":"0x..."}'
 */
export type TokenIdentifier = string | TokenTarget;

/** Custom color overrides */
export interface CustomColors {
  primary?: string;
  background?: string;
  textPrimary?: string;
  textSecondary?: string;
  border?: string;
  success?: string;
  error?: string;
  warning?: string;
}

/** Amount change data */
export interface AmountChangedData {
  amount: string;
  direction: "from" | "to";
}

/** Data emitted on swap success */
export interface SwapSuccessData {
  orderId: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  txHash: string;
}

/** Data emitted on swap error */
export interface SwapErrorData {
  code: string;
  message: string;
  details?: unknown;
}

/** Data emitted when wallet is connected */
export interface WalletConnectedData {
  address: string;
  chainType: string;
}

/** Callback interfaces for widget events */
export interface Callbacks {
  onSwapSuccess?(data: SwapSuccessData): void;
  onSwapError?(data: SwapErrorData): void;
  onWalletConnected?(data: WalletConnectedData): void;
  onQuoteReceived?(data: QuoteResponse): void;
  onAmountChanged?(data: AmountChangedData): void;
  /** Called when user clicks Connect Wallet and no walletAdapter is provided */
  onConnectWallet?(): void;
}

/** Shared configuration fields for both widgets */
export interface TokenFlightConfigBase {
  /** HyperStream API endpoint */
  apiEndpoint?: string;
  /** Visual theme */
  theme?: "light" | "dark" | "auto";
  /** Locale for i18n */
  locale?: string;
  /** Custom CSS color overrides */
  customColors?: Record<string, string>;
  /** Optional custom widget title text */
  titleText?: string;
  /** Optional custom widget title image URL */
  titleImageUrl?: string;
  /** Hide top title/header area */
  hideTitle?: boolean;
  /** Hide "Powered by Khalani" footer */
  hidePoweredBy?: boolean;
}

/** Configuration for `<tokenflight-swap>` */
export interface TokenFlightSwapConfig extends TokenFlightConfigBase {
  /** Optional source token */
  fromToken?: TokenIdentifier;
  /** Optional destination token */
  toToken?: TokenIdentifier;
  /** Event callbacks */
  callbacks?: Callbacks;
}

/** Configuration for `<tokenflight-receive>` */
export interface TokenFlightReceiveConfig extends TokenFlightConfigBase {
  /** Required: target token to receive */
  target: TokenIdentifier;
  /** Required: amount to receive */
  amount: string;
  /** Optional source token to pay with */
  fromToken?: TokenIdentifier;
  /** Optional icon URL for the target token */
  icon?: string;
  /** Event callbacks */
  callbacks?: Callbacks;
}

export interface TokenFlightSwapOptions {
  container: string | HTMLElement;
  config: TokenFlightSwapConfig;
  walletAdapter?: IWalletAdapter;
  callbacks?: Callbacks;
}

export interface TokenFlightReceiveOptions {
  container: string | HTMLElement;
  config: TokenFlightReceiveConfig;
  walletAdapter?: IWalletAdapter;
  callbacks?: Callbacks;
}
