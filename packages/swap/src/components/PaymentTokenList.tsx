import { For } from "solid-js";
import { TokenIcon, ChainBadge, ChainDot, chainIconUrl, ArrowRight } from "./icons";
import { t } from "../i18n";
import { SignificantNumber } from "./SignificantNumber";


export interface PaymentToken {
  symbol: string;
  chain: string;
  color: string;
  amount: string;
  feeAmount: string;
  feeSymbol: string;
  balance: string;
  best?: boolean;
  disabled?: boolean;
  logoURI?: string;
  chainId?: number;
}

export interface PaymentTokenListProps {
  tokens: PaymentToken[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onBrowseAll: () => void;
  apiEndpoint?: string;
}

export function PaymentTokenList(props: PaymentTokenListProps) {
  return (
    <div class="tf-pay-token-list">
      <div class="tf-pay-token-scroll">
        <For each={props.tokens}>
          {(token, i) => {
            const isActive = () => i() === props.selectedIndex;
            const chainColor = () => null;

            return (
              <button
                class={`tf-pay-token ${isActive() ? "tf-pay-token--active" : ""} ${token.disabled ? "tf-pay-token--disabled" : ""}`}
                onClick={() => !token.disabled && props.onSelect(i())}
                disabled={token.disabled}
              >
                <div class="tf-pay-token-left">
                  <div class="tf-pay-token-icon-wrap">
                    <TokenIcon symbol={token.symbol} color={token.color} size={30} logoURI={token.logoURI} />
                    <div class="tf-pay-token-chain-dot">
                      <ChainDot color={chainColor()} size={9} iconUrl={token.chainId ? chainIconUrl(props.apiEndpoint, token.chainId) : undefined} />
                    </div>
                  </div>
                  <div class="tf-pay-token-info">
                    <div class="tf-pay-token-top-row">
                      <span class="tf-pay-token-symbol">{token.symbol}</span>
                      <ChainBadge chain={token.chain} compact />
                      {token.best && <span class="tf-best-badge">{t("receive.best")}</span>}
                    </div>
                    <span class="tf-pay-token-balance">
                      {t("swap.balance", { balance: token.balance })}
                    </span>
                  </div>
                </div>
                <div class="tf-pay-token-right">
                  <div class="tf-pay-token-amount">{token.amount}</div>
                  <div class="tf-pay-token-fee">
                    {t("swap.fee")}: <SignificantNumber value={token.feeAmount} digits={8} /> {token.feeSymbol}
                  </div>
                </div>
              </button>
            );
          }}
        </For>
      </div>
      <button class="tf-browse-all" onClick={props.onBrowseAll}>
        {t("receive.browseAll")} <ArrowRight size={14} />
      </button>
    </div>
  );
}
