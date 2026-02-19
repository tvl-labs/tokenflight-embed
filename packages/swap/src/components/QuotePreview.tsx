import { Show, createMemo } from "solid-js";
import type { QuoteRoute, ResolvedToken } from "../types/api";
import { computeExchangeRate, formatDisplayAmount } from "../helpers/amount-utils";
import { formatNativeFeeDisplay } from "../helpers/native-fee";
import { t } from "../i18n";
import { SignificantNumber } from "./SignificantNumber";

export interface QuotePreviewProps {
  route: QuoteRoute;
  fromToken: ResolvedToken;
  toToken: ResolvedToken;
}

export function QuotePreviewSkeleton() {
  return (
    <div class="tf-quote tf-quote--loading" part="price-preview" aria-hidden="true">
      <div class="tf-quote-row">
        <div class="tf-skeleton tf-quote-skeleton-label" />
        <div class="tf-skeleton tf-quote-skeleton-value" />
      </div>
      <div class="tf-quote-row">
        <div class="tf-skeleton tf-quote-skeleton-label" />
        <div class="tf-skeleton tf-quote-skeleton-value tf-quote-skeleton-value--short" />
      </div>
      <div class="tf-quote-row">
        <div class="tf-skeleton tf-quote-skeleton-label tf-quote-skeleton-label--short" />
        <div class="tf-skeleton tf-quote-skeleton-value tf-quote-skeleton-value--tiny" />
      </div>
    </div>
  );
}

export function QuotePreview(props: QuotePreviewProps) {
  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      return t("time.minutes", { value: Math.round(seconds / 60) });
    }
    return t("time.seconds", { value: seconds });
  };

  const exchangeRate = () => {
    const fromDecimals = props.fromToken.decimals ?? 18;
    const toDecimals = props.toToken.decimals ?? 18;
    const rate = computeExchangeRate(
      props.route.quote.amountIn,
      fromDecimals,
      props.route.quote.amountOut,
      toDecimals,
    );
    return formatDisplayAmount(rate, 4);
  };

  const feeDisplay = createMemo(() =>
    formatNativeFeeDisplay(props.route.quote.estimatedGas, props.fromToken.chainId),
  );

  return (
    <div class="tf-quote" part="price-preview">
      <div class="tf-quote-row">
        <span>{t("swap.rate")}</span>
        <span class="tf-quote-value">
          1 {props.fromToken.symbol ?? "?"} = {exchangeRate()} {props.toToken.symbol ?? "?"}
        </span>
      </div>
      <Show when={props.route.quote.estimatedGas}>
        <div class="tf-quote-row">
          <span>{t("swap.fee")}</span>
          <span class="tf-quote-value">
            ~<SignificantNumber value={feeDisplay().amount} digits={8} /> {feeDisplay().symbol}
          </span>
        </div>
      </Show>
      <div class="tf-quote-row">
        <span>{t("swap.estTime")}</span>
        <span class="tf-quote-value">{formatTime(props.route.quote.expectedDurationSeconds)}</span>
      </div>
    </div>
  );
}
