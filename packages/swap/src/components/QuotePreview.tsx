import { Show } from "solid-js";
import type { QuoteResponse } from "../types/api";
import { t } from "../i18n";

export interface QuotePreviewProps {
  quote: QuoteResponse;
}

export function QuotePreview(props: QuotePreviewProps) {
  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      return t("time.minutes", { value: Math.round(seconds / 60) });
    }
    return t("time.seconds", { value: seconds });
  };

  return (
    <div class="tf-quote" part="price-preview">
      <div class="tf-quote-row">
        <span>{t("swap.rate")}</span>
        <span class="tf-quote-value">
          1 {props.quote.fromToken.symbol} = {props.quote.exchangeRate} {props.quote.toToken.symbol}
        </span>
      </div>
      <div class="tf-quote-row">
        <span>{t("swap.fee")}</span>
        <span class="tf-quote-value">${props.quote.estimatedFee}</span>
      </div>
      <div class="tf-quote-row">
        <span>{t("swap.estTime")}</span>
        <span class="tf-quote-value">{formatTime(props.quote.estimatedTime)}</span>
      </div>
    </div>
  );
}
