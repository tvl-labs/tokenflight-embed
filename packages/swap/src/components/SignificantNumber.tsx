import { createMemo } from "solid-js";

type DisplayValue =
  | string
  | {
      prefix: string;
      zeroCount: number;
      suffix: string;
    };

export interface SignificantNumberProps {
  value: string | number | bigint | null | undefined;
  digits?: number;
  fixedDecimals?: number;
}

function normalizeNumberString(value: SignificantNumberProps["value"]): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return raw;
}

function removeTrailingZeros(value: string): string {
  if (!value.includes(".")) return value;
  return value.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "").replace(/\.$/, "");
}

function toNonExponentialString(value: number, digits: number, fixedDecimals?: number): string | null {
  if (!Number.isFinite(value)) return null;
  if (fixedDecimals !== undefined) {
    return value.toFixed(fixedDecimals);
  }

  if (value === 0) return "0";

  // For very tiny values, toPrecision prevents underflow to "0".
  const abs = Math.abs(value);
  const raw = abs < 1 ? value.toPrecision(digits) : value.toLocaleString("en-US", {
    useGrouping: false,
    maximumSignificantDigits: digits,
  });

  // Convert scientific notation to plain decimal when needed.
  if (!/[eE]/.test(raw)) return raw;
  const [coeff, expPart] = raw.toLowerCase().split("e");
  if (!coeff || expPart === undefined) return raw;
  const exp = Number(expPart);
  if (!Number.isFinite(exp)) return raw;

  const sign = coeff.startsWith("-") ? "-" : "";
  const unsigned = sign ? coeff.slice(1) : coeff;
  const [intPart, fracPart = ""] = unsigned.split(".");
  const digitsOnly = `${intPart ?? ""}${fracPart}`;
  const decimalPos = (intPart?.length ?? 0) + exp;

  if (decimalPos <= 0) {
    return `${sign}0.${"0".repeat(Math.abs(decimalPos))}${digitsOnly}`;
  }
  if (decimalPos >= digitsOnly.length) {
    return `${sign}${digitsOnly}${"0".repeat(decimalPos - digitsOnly.length)}`;
  }
  return `${sign}${digitsOnly.slice(0, decimalPos)}.${digitsOnly.slice(decimalPos)}`;
}

function formatToSignificantDisplay(
  value: SignificantNumberProps["value"],
  digits: number,
  fixedDecimals?: number,
): DisplayValue | null {
  const normalized = normalizeNumberString(value);
  if (!normalized) return null;

  const numeric = Number(normalized);
  const formatted = toNonExponentialString(numeric, digits, fixedDecimals);
  if (!formatted) return null;
  const trimmed = removeTrailingZeros(formatted);

  const zeroMatch = trimmed.match(/^(-?\d+)\.(0+)(\d*)$/);
  if (!zeroMatch) return trimmed;

  const intPart = zeroMatch[1];
  const zeros = zeroMatch[2];
  const rest = zeroMatch[3] ?? "";
  if (!intPart || !zeros || zeros.length < 3) return trimmed;

  return {
    prefix: `${intPart}.${zeros.charAt(0)}`,
    zeroCount: zeros.length,
    suffix: rest,
  };
}

export function SignificantNumber(props: SignificantNumberProps) {
  const digits = () => props.digits ?? 8;

  const display = createMemo(() =>
    formatToSignificantDisplay(props.value, digits(), props.fixedDecimals),
  );

  const fullValue = createMemo(() => {
    const d = display();
    if (d === null || typeof d === "string") return null;
    const expanded = toNonExponentialString(Number(props.value ?? 0), 18);
    return expanded ? removeTrailingZeros(expanded) : null;
  });

  return (
    <>
      {(() => {
        const d = display();
        if (d === null) return null;
        if (typeof d === "string") return d;

        const content = (
          <span class="tf-significant-number">
            <span>{d.prefix}</span>
            <span class="tf-significant-zero-count" aria-hidden="true">
              {d.zeroCount}
            </span>
            <span>{d.suffix}</span>
          </span>
        );

        const full = fullValue();
        if (!full) return content;
        return (
          <span class="tf-significant-tooltip" title={full}>
            {content}
          </span>
        );
      })()}
    </>
  );
}

