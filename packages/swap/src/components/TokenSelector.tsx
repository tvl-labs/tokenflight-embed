import { createSignal, For, Show, createMemo } from "solid-js";
import { TokenIcon, ChainBadge, ChainDot } from "./icons";
import { t } from "../i18n";

export interface TokenItem {
  symbol: string;
  name: string;
  chain: string;
  chainId: number;
  color: string;
  balance: string;
  usd: string;
  address?: string;
}

const POPULAR_TOKENS = ["USDC", "ETH", "USDT", "WBTC"];

const CHAINS = [
  { name: "All Chains", color: null as string | null },
  { name: "Ethereum", color: "#627EEA" },
  { name: "Base", color: "#0052FF" },
  { name: "Arbitrum", color: "#28A0F0" },
  { name: "Solana", color: "#9945FF" },
];

export interface TokenSelectorProps {
  tokens: TokenItem[];
  selectingFor: "from" | "to";
  onSelect: (token: TokenItem) => void;
  onClose: () => void;
}

export function TokenSelector(props: TokenSelectorProps) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [activeChain, setActiveChain] = createSignal("All Chains");
  const [searchFocused, setSearchFocused] = createSignal(false);

  const filtered = createMemo(() => {
    return props.tokens.filter((tk) => {
      if (activeChain() !== "All Chains" && tk.chain !== activeChain()) return false;
      const q = searchQuery().toLowerCase();
      if (q && !tk.symbol.toLowerCase().includes(q) && !tk.name.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") props.onClose();
  };

  return (
    <div class="tf-selector" role="dialog" aria-label={t(props.selectingFor === "from" ? "selector.title.from" : "selector.title.to")} on:keydown={handleKeyDown}>
      <div class="tf-selector-header">
        <div class="tf-selector-title-row">
          <span class="tf-selector-title">
            {t(props.selectingFor === "from" ? "selector.title.from" : "selector.title.to")}
          </span>
          <button class="tf-selector-close" onClick={props.onClose} aria-label="Close">
            {"\u00D7"}
          </button>
        </div>

        <div class={`tf-selector-search ${searchFocused() ? "tf-selector-search--focused" : ""}`}>
          <span class="tf-selector-search-icon">{"\u2315"}</span>
          <input
            class="tf-selector-search-input"
            placeholder={t("selector.search")}
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        <div class="tf-popular-tokens">
          <For each={POPULAR_TOKENS}>
            {(sym) => {
              const token = () => props.tokens.find((x) => x.symbol === sym && x.chain === "Ethereum");
              return (
                <Show when={token()}>
                  <button
                    class="tf-popular-token"
                    onClick={() => props.onSelect(token()!)}
                  >
                    <TokenIcon symbol={sym} color={token()!.color} size={20} />
                    <span class="tf-popular-token-name">{sym}</span>
                  </button>
                </Show>
              );
            }}
          </For>
        </div>

        <div class="tf-chain-filter">
          <For each={CHAINS}>
            {(chain) => (
              <button
                class={`tf-chain-filter-btn ${activeChain() === chain.name ? "tf-chain-filter-btn--active" : ""}`}
                onClick={() => setActiveChain(chain.name)}
              >
                <ChainDot color={chain.color} size={7} />
                {chain.name}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="tf-selector-divider" />

      <div class="tf-token-list">
        <For each={filtered()} fallback={
          <div style={{ padding: "20px", "text-align": "center", color: "var(--tf-text-tertiary)", "font-size": "13px" }}>
            {t("selector.noResults")}
          </div>
        }>
          {(token) => {
            const hasBalance = () => token.balance !== "0";
            const chainColor = () => CHAINS.find((c) => c.name === token.chain)?.color ?? null;
            return (
              <button
                class="tf-token-list-item"
                onClick={() => props.onSelect(token)}
              >
                <div class="tf-token-list-left">
                  <div class="tf-token-list-icon-wrap">
                    <TokenIcon symbol={token.symbol} color={token.color} size={36} />
                    <div class="tf-token-list-chain-indicator">
                      <ChainDot color={chainColor()} size={9} />
                    </div>
                  </div>
                  <div class="tf-token-list-info">
                    <div class="tf-token-list-symbol-row">
                      <span class="tf-token-list-symbol">{token.symbol}</span>
                      <ChainBadge chain={token.chain} compact />
                    </div>
                    <span class="tf-token-list-name">{token.name}</span>
                  </div>
                </div>
                <div class="tf-token-list-right">
                  <div class={`tf-token-list-balance ${!hasBalance() ? "tf-token-list-balance--zero" : ""}`}>
                    {token.balance}
                  </div>
                  <div class="tf-token-list-usd">{token.usd}</div>
                </div>
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
}
