/**
 * Convert base units (bigint string) to display amount using token decimals.
 * e.g., toDisplayAmount("1000000", 6) → "1"
 *       toDisplayAmount("1500000", 6) → "1.5"
 */
export function toDisplayAmount(baseUnits: string, decimals: number): string {
  if (!baseUnits || decimals < 0) return "0";

  // Handle hex strings
  const normalized = baseUnits.startsWith("0x")
    ? BigInt(baseUnits).toString()
    : baseUnits;

  // Handle negative amounts
  const isNegative = normalized.startsWith("-");
  const abs = isNegative ? normalized.slice(1) : normalized;

  if (decimals === 0) {
    return isNegative ? `-${abs}` : abs;
  }

  const padded = abs.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, padded.length - decimals);
  const fracPart = padded.slice(padded.length - decimals).replace(/0+$/, "");

  const result = fracPart ? `${intPart}.${fracPart}` : intPart;
  return isNegative ? `-${result}` : result;
}

/**
 * Convert display amount to base units (bigint string) using token decimals.
 * e.g., toBaseUnits("1", 6) → "1000000"
 *       toBaseUnits("1.5", 6) → "1500000"
 */
export function toBaseUnits(displayAmount: string, decimals: number): string {
  if (!displayAmount) return "0";

  const isNegative = displayAmount.startsWith("-");
  const abs = isNegative ? displayAmount.slice(1) : displayAmount;

  const parts = abs.split(".");
  const intPart = parts[0] ?? "0";
  const fracPart = (parts[1] ?? "").slice(0, decimals).padEnd(decimals, "0");

  const combined = intPart + fracPart;
  // Remove leading zeros but keep at least one digit
  const result = combined.replace(/^0+/, "") || "0";
  return isNegative ? `-${result}` : result;
}

/**
 * Compute exchange rate as a display string.
 * Returns how many toToken units you get per 1 fromToken.
 */
export function computeExchangeRate(
  amountIn: string,
  decimalsIn: number,
  amountOut: string,
  decimalsOut: number,
): string {
  if (!amountIn || !amountOut || amountIn === "0") return "0";

  const inBig = BigInt(amountIn);
  const outBig = BigInt(amountOut);

  if (inBig === 0n) return "0";

  // Scale: rate = (amountOut / 10^decimalsOut) / (amountIn / 10^decimalsIn)
  // = amountOut * 10^decimalsIn / (amountIn * 10^decimalsOut)
  // We use 8 decimal places of precision for the rate
  const PRECISION = 8;
  const scale = 10n ** BigInt(PRECISION);
  const numerator = outBig * 10n ** BigInt(decimalsIn) * scale;
  const denominator = inBig * 10n ** BigInt(decimalsOut);
  const rateScaled = numerator / denominator;

  const rateStr = rateScaled.toString().padStart(PRECISION + 1, "0");
  const intPart = rateStr.slice(0, rateStr.length - PRECISION);
  const fracPart = rateStr.slice(rateStr.length - PRECISION).replace(/0+$/, "");

  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

/**
 * Format a display amount to a fixed number of significant decimals.
 * Avoids showing excessive precision in the UI.
 */
export function formatDisplayAmount(amount: string, maxDecimals = 6): string {
  if (!amount || amount === "0") return "0";

  const parts = amount.split(".");
  if (!parts[1]) return amount;

  const trimmed = parts[1].slice(0, maxDecimals).replace(/0+$/, "");
  return trimmed ? `${parts[0]}.${trimmed}` : (parts[0] ?? "0");
}
