import { Show } from "solid-js";
import type { QuoteRoute, ResolvedToken } from "../types/api";
import { computeExchangeRate, formatDisplayAmount } from "../helpers/amount-utils";
import { t } from "../i18n";

export interface QuotePreviewProps {
  route: QuoteRoute;
  fromToken: ResolvedToken;
  toToken: ResolvedToken;
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
          <span class="tf-quote-value">~{props.route.quote.estimatedGas} gas</span>
        </div>
      </Show>
      <div class="tf-quote-row">
        <span>{t("swap.estTime")}</span>
        <span class="tf-quote-value">{formatTime(props.route.quote.expectedDurationSeconds)}</span>
      </div>
    </div>
  );
}
