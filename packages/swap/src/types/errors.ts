/** Error codes for TokenFlight SDK */
export enum ErrorCode {
  INVALID_CONFIG = "TF1001",
  INVALID_TOKEN_IDENTIFIER = "TF1002",
  INVALID_AMOUNT = "TF1003",
  MISSING_REQUIRED_CONFIG = "TF1004",
  WALLET_NOT_CONNECTED = "TF2001",
  WALLET_CONNECTION_FAILED = "TF2002",
  WALLET_ACTION_FAILED = "TF2003",
  WALLET_ACTION_REJECTED = "TF2004",
  UNSUPPORTED_ACTION_TYPE = "TF2005",
  API_REQUEST_FAILED = "TF3001",
  API_TIMEOUT = "TF3002",
  API_INVALID_RESPONSE = "TF3003",
  QUOTE_FAILED = "TF3004",
  QUOTE_EXPIRED = "TF3005",
  DEPOSIT_BUILD_FAILED = "TF3006",
  DEPOSIT_SUBMIT_FAILED = "TF3007",
  ORDER_FAILED = "TF3008",
  TRANSACTION_FAILED = "TF4001",
  TRANSACTION_REJECTED = "TF4002",
  INSUFFICIENT_BALANCE = "TF4003",
  SLIPPAGE_EXCEEDED = "TF4004",
  ELEMENT_NOT_FOUND = "TF5001",
  INITIALIZATION_FAILED = "TF5002",
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_CONFIG]: "Invalid configuration provided",
  [ErrorCode.INVALID_TOKEN_IDENTIFIER]: "Invalid token identifier format",
  [ErrorCode.INVALID_AMOUNT]: "Invalid amount value",
  [ErrorCode.MISSING_REQUIRED_CONFIG]: "Missing required configuration field",
  [ErrorCode.WALLET_NOT_CONNECTED]: "Wallet is not connected",
  [ErrorCode.WALLET_CONNECTION_FAILED]: "Failed to connect wallet",
  [ErrorCode.WALLET_ACTION_FAILED]: "Wallet action failed",
  [ErrorCode.WALLET_ACTION_REJECTED]: "Wallet action was rejected by user",
  [ErrorCode.UNSUPPORTED_ACTION_TYPE]: "Unsupported wallet action type",
  [ErrorCode.API_REQUEST_FAILED]: "API request failed",
  [ErrorCode.API_TIMEOUT]: "API request timed out",
  [ErrorCode.API_INVALID_RESPONSE]: "Invalid API response",
  [ErrorCode.QUOTE_FAILED]: "Failed to get quote",
  [ErrorCode.QUOTE_EXPIRED]: "Quote has expired",
  [ErrorCode.DEPOSIT_BUILD_FAILED]: "Failed to build deposit transaction",
  [ErrorCode.DEPOSIT_SUBMIT_FAILED]: "Failed to submit deposit",
  [ErrorCode.ORDER_FAILED]: "Order processing failed",
  [ErrorCode.TRANSACTION_FAILED]: "Transaction failed",
  [ErrorCode.TRANSACTION_REJECTED]: "Transaction was rejected",
  [ErrorCode.INSUFFICIENT_BALANCE]: "Insufficient balance",
  [ErrorCode.SLIPPAGE_EXCEEDED]: "Slippage tolerance exceeded",
  [ErrorCode.ELEMENT_NOT_FOUND]: "Target DOM element not found",
  [ErrorCode.INITIALIZATION_FAILED]: "Widget initialization failed",
};

/** Custom error class for TokenFlight SDK */
export class TokenFlightError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "TokenFlightError";
    this.code = code;
    this.details = details;
  }
}
