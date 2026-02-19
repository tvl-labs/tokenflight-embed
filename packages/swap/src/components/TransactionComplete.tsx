import { Show } from "solid-js";
import { Check, ExternalLink } from "./icons";
import { TokenIcon } from "./icons";
import { t } from "../i18n";
import { toDisplayAmount, formatDisplayAmount } from "../helpers/amount-utils";
import type { ResolvedToken } from "../types/api";
import type { OrderResponse } from "../types/api";

export interface TransactionCompleteProps {
  order: OrderResponse;
  fromToken: ResolvedToken | null;
  toToken: ResolvedToken | null;
  onNewSwap: () => void;
}

export function TransactionComplete(props: TransactionCompleteProps) {
  const sentAmount = () => {
    if (!props.order.srcAmount || !props.fromToken?.decimals) return props.order.srcAmount ?? "0";
    return formatDisplayAmount(toDisplayAmount(props.order.srcAmount, props.fromToken.decimals), 6);
  };

  const receivedAmount = () => {
    if (!props.order.destAmount || !props.toToken?.decimals) return props.order.destAmount ?? "0";
    return formatDisplayAmount(toDisplayAmount(props.order.destAmount, props.toToken.decimals), 6);
  };

  const explorerUrl = () => {
    const txHash = props.order.depositTxHash;
    if (!txHash) return null;
    const chainId = props.order.fromChainId;
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      8453: "https://basescan.org",
      42161: "https://arbiscan.io",
      10: "https://optimistic.etherscan.io",
      137: "https://polygonscan.com",
    };
    const base = explorers[chainId];
    return base ? `${base}/tx/${txHash}` : null;
  };

  return (
    <div class="tf-success-page">
      <div class="tf-success-icon-wrap">
        <div class="tf-success-icon">
          <Check size={28} />
        </div>
      </div>

      <div class="tf-success-title">{t("success.title")}</div>

      <div class="tf-success-details">
        <div class="tf-success-row">
          <span class="tf-success-label">{t("success.sent")}</span>
          <div class="tf-success-token">
            <Show when={props.fromToken}>
              <TokenIcon
                symbol={props.fromToken!.symbol ?? "?"}
                color="#2775CA"
                size={20}
                logoURI={props.fromToken!.logoURI}
              />
            </Show>
            <span class="tf-success-amount">{sentAmount()}</span>
            <span class="tf-success-symbol">{props.fromToken?.symbol ?? ""}</span>
          </div>
        </div>

        <div class="tf-success-arrow">→</div>

        <div class="tf-success-row">
          <span class="tf-success-label">{t("success.received")}</span>
          <div class="tf-success-token">
            <Show when={props.toToken}>
              <TokenIcon
                symbol={props.toToken!.symbol ?? "?"}
                color="#0052FF"
                size={20}
                logoURI={props.toToken!.logoURI}
              />
            </Show>
            <span class="tf-success-amount">{receivedAmount()}</span>
            <span class="tf-success-symbol">{props.toToken?.symbol ?? ""}</span>
          </div>
        </div>
      </div>

      <Show when={explorerUrl()}>
        <a
          href={explorerUrl()!}
          target="_blank"
          rel="noopener noreferrer"
          class="tf-success-explorer"
        >
          {t("success.viewExplorer")} <ExternalLink size={12} />
        </a>
      </Show>

      <button class="tf-success-new-btn" onClick={props.onNewSwap}>
        {t("success.newSwap")}
      </button>
    </div>
  );
}
