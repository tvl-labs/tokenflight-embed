import { For } from "solid-js";
import { TokenIcon, ChainBadge, ChainDot } from "./icons";
import { t } from "../i18n";

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "#627EEA",
  Base: "#0052FF",
  Arbitrum: "#28A0F0",
  Solana: "#9945FF",
};

export interface PaymentToken {
  symbol: string;
  chain: string;
  color: string;
  amount: string;
  fee: string;
  balance: string;
  best?: boolean;
  disabled?: boolean;
}

export interface PaymentTokenListProps {
  tokens: PaymentToken[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onBrowseAll: () => void;
}

export function PaymentTokenList(props: PaymentTokenListProps) {
  return (
    <div class="tf-pay-token-list">
      <For each={props.tokens}>
        {(token, i) => {
          const isActive = () => i() === props.selectedIndex;
          const chainColor = () => CHAIN_COLORS[token.chain] ?? null;

          return (
            <button
              class={`tf-pay-token ${isActive() ? "tf-pay-token--active" : ""} ${token.disabled ? "tf-pay-token--disabled" : ""}`}
              onClick={() => !token.disabled && props.onSelect(i())}
              disabled={token.disabled}
            >
              <div class="tf-pay-token-left">
                <div class="tf-pay-token-icon-wrap">
                  <TokenIcon symbol={token.symbol} color={token.color} size={30} />
                  <div class="tf-pay-token-chain-dot">
                    <ChainDot color={chainColor()} size={7} />
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
                <div class="tf-pay-token-fee">{t("receive.fee", { value: token.fee })}</div>
              </div>
            </button>
          );
        }}
      </For>
      <button class="tf-browse-all" onClick={props.onBrowseAll}>
        {t("receive.browseAll")} {"\u2192"}
      </button>
    </div>
  );
}
