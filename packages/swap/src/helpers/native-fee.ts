import { formatDisplayAmount, toDisplayAmount } from "./amount-utils";

interface NativeTokenInfo {
  symbol: string;
  decimals: number;
}

export interface NativeFeeDisplay {
  amount: string;
  symbol: string;
}

const NATIVE_TOKEN_MAP: Record<number, NativeTokenInfo> = {
  // EVM (ETH-native)
  1: { symbol: "ETH", decimals: 18 },
  10: { symbol: "ETH", decimals: 18 },
  8453: { symbol: "ETH", decimals: 18 },
  42161: { symbol: "ETH", decimals: 18 },
  324: { symbol: "ETH", decimals: 18 },
  59144: { symbol: "ETH", decimals: 18 },
  11155111: { symbol: "ETH", decimals: 18 },
  11155420: { symbol: "ETH", decimals: 18 },
  1313161554: { symbol: "ETH", decimals: 18 },
  // Other EVM
  56: { symbol: "BNB", decimals: 18 },
  137: { symbol: "POL", decimals: 18 },
  43114: { symbol: "AVAX", decimals: 18 },
  // Non-EVM
  20011000000: { symbol: "SOL", decimals: 9 },
};

function getNativeTokenInfo(chainId: number): NativeTokenInfo {
  return NATIVE_TOKEN_MAP[chainId] ?? { symbol: "ETH", decimals: 18 };
}

function formatNativeAmount(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num === 0) return "0";
  if (num >= 1) return formatDisplayAmount(value, 4);
  if (num >= 0.01) return formatDisplayAmount(value, 6);
  return formatDisplayAmount(value, 8);
}

/**
 * Format base-unit fee to native token display amount.
 * Examples:
 * - EVM wei -> ETH
 * - Solana lamports -> SOL
 */
export function formatNativeFee(
  feeRaw: string | null | undefined,
  chainId: number,
): string {
  const fee = formatNativeFeeDisplay(feeRaw, chainId);
  return `${fee.amount} ${fee.symbol}`;
}

export function formatNativeFeeDisplay(
  feeRaw: string | null | undefined,
  chainId: number,
): NativeFeeDisplay {
  const { symbol, decimals } = getNativeTokenInfo(chainId);
  const raw = (feeRaw ?? "").trim();
  if (!raw) return { amount: "0", symbol };

  try {
    // If API already returns a decimal string, keep it as display amount.
    if (raw.includes(".")) {
      return { amount: formatNativeAmount(raw), symbol };
    }

    const display = toDisplayAmount(raw, decimals);
    return { amount: formatNativeAmount(display), symbol };
  } catch {
    return { amount: raw, symbol };
  }
}
