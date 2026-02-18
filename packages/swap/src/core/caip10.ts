import type { TokenTarget } from "../types/config";
import { ErrorCode, TokenFlightError } from "../types/errors";

/** CAIP-2 namespace to chainId mapping */
const NAMESPACE_CHAIN_MAP: Record<string, Record<string, number>> = {
  eip155: {
    "1": 1,
    "137": 137,
    "42161": 42161,
    "8453": 8453,
    "10": 10,
    "56": 56,
    "43114": 43114,
  },
  solana: {
    "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": 20011000000,
  },
};

/**
 * Parse a flexible token identifier into a TokenTarget.
 *
 * Supports:
 * - CAIP-10 string: "eip155:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
 * - JSON string: '{"chainId":1,"address":"0xA0b8..."}'
 * - Direct object: { chainId: 1, address: "0xA0b8..." }
 */
export function parseTokenIdentifier(input: string | TokenTarget): TokenTarget {
  // Already an object
  if (typeof input === "object" && input !== null) {
    if (typeof input.chainId !== "number" || typeof input.address !== "string") {
      throw new TokenFlightError(
        ErrorCode.INVALID_TOKEN_IDENTIFIER,
        "Token target must have numeric chainId and string address",
        input
      );
    }
    return { chainId: input.chainId, address: input.address };
  }

  if (typeof input !== "string") {
    throw new TokenFlightError(
      ErrorCode.INVALID_TOKEN_IDENTIFIER,
      "Token identifier must be a string or TokenTarget object",
      input
    );
  }

  // Try JSON parse
  if (input.startsWith("{")) {
    try {
      const parsed = JSON.parse(input) as Record<string, unknown>;
      if (
        typeof parsed.chainId === "number" &&
        typeof parsed.address === "string"
      ) {
        return { chainId: parsed.chainId, address: parsed.address };
      }
    } catch {
      // Fall through to CAIP-10 parsing
    }
    throw new TokenFlightError(
      ErrorCode.INVALID_TOKEN_IDENTIFIER,
      "Invalid JSON token identifier",
      input
    );
  }

  // CAIP-10: namespace:reference:address
  const parts = input.split(":");
  if (parts.length !== 3) {
    throw new TokenFlightError(
      ErrorCode.INVALID_TOKEN_IDENTIFIER,
      `Invalid CAIP-10 format: expected "namespace:reference:address", got "${input}"`,
      input
    );
  }

  const [namespace, reference, address] = parts;
  if (!namespace || !reference || !address) {
    throw new TokenFlightError(
      ErrorCode.INVALID_TOKEN_IDENTIFIER,
      "CAIP-10 parts cannot be empty",
      input
    );
  }

  const nsMap = NAMESPACE_CHAIN_MAP[namespace];
  let chainId: number;

  if (nsMap && nsMap[reference] !== undefined) {
    chainId = nsMap[reference];
  } else if (namespace === "eip155") {
    // EIP-155 reference is the chainId directly
    chainId = parseInt(reference, 10);
    if (isNaN(chainId)) {
      throw new TokenFlightError(
        ErrorCode.INVALID_TOKEN_IDENTIFIER,
        `Invalid EIP-155 chain reference: "${reference}"`,
        input
      );
    }
  } else {
    throw new TokenFlightError(
      ErrorCode.INVALID_TOKEN_IDENTIFIER,
      `Unknown CAIP-10 namespace: "${namespace}"`,
      input
    );
  }

  return { chainId, address };
}
