import { createSignal, For, Show, createMemo, onMount, createEffect } from "solid-js";
import { TokenIcon, ChainBadge, ChainDot, chainIconUrl, X, Search } from "./icons";
import { t } from "../i18n";
import type { HyperstreamApi } from "../core/hyperstream-api";
import type { TokenInfo } from "../types/api";
import { toDisplayAmount, formatDisplayAmount } from "../core/amount-utils";
import { loadChains, getChainDisplay, type ChainDisplay } from "../core/chain-registry";
import { createTokenListQuery } from "../core/queries";

export interface TokenItem {
  symbol: string;
  name: string;
  chain: string;
  chainId: number;
  color: string;
  balance: string;
  usd: string;
  address?: string;
  decimals?: number;
  logoURI?: string;
}

const POPULAR_TOKENS = ["USDC", "ETH", "USDT", "WBTC"];

function apiTokenToItem(token: TokenInfo): TokenItem {
  const chainInfo = getChainDisplay(token.chainId);
  const balance = token.extensions?.balance
    ? formatDisplayAmount(toDisplayAmount(token.extensions.balance, token.decimals), 4)
    : "0";
  const priceUsd = token.extensions?.price?.usd;
  let usd = "$0.00";
  if (priceUsd && token.extensions?.balance) {
    const displayBal = toDisplayAmount(token.extensions.balance, token.decimals);
    const val = parseFloat(displayBal) * parseFloat(priceUsd);
    usd = `$${val.toFixed(2)}`;
  }
  return {
    symbol: token.symbol,
    name: token.name,
    chain: chainInfo?.name ?? `Chain ${token.chainId}`,
    chainId: token.chainId,
    color: "#888",
    balance,
    usd,
    address: token.address,
    decimals: token.decimals,
    logoURI: token.logoURI,
  };
}

export interface TokenSelectorProps {
  tokens?: TokenItem[];
  client?: HyperstreamApi | null;
  selectingFor: "from" | "to";
  onSelect: (token: TokenItem) => void;
  onClose: () => void;
}

export function TokenSelector(props: TokenSelectorProps) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [activeChain, setActiveChain] = createSignal("All Chains");
  const [searchFocused, setSearchFocused] = createSignal(false);
  const [searchResults, setSearchResults] = createSignal<TokenItem[] | null>(null);
  const [chains, setChains] = createSignal<ChainDisplay[]>([]);
  const apiBase = () => props.client?.baseUrl;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  // Load top tokens via solid-query (auto-cached, 5min stale)
  const tokenListQuery = createTokenListQuery(
    () => props.client ?? null,
    () => !!props.client,
  );

  const apiTokens = createMemo(() => {
    const data = tokenListQuery.data;
    return data ? data.map(apiTokenToItem) : [];
  });

  // Load chains from API on mount
  onMount(async () => {
    if (props.client) {
      try {
        const chainList = await loadChains(props.client);
        setChains(chainList);
      } catch {
        // Fallback
      }
    }
  });

  // Debounced search
  createEffect(() => {
    const query = searchQuery();
    if (debounceTimer) clearTimeout(debounceTimer);

    if (!query || !props.client) {
      setSearchResults(null);
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const result = await props.client!.searchTokens(query);
        setSearchResults(result.data.map(apiTokenToItem));
      } catch {
        setSearchResults(null);
      }
    }, 300);
  });

  const baseTokens = createMemo(() => {
    if (searchResults() !== null) return searchResults()!;
    const tokens = apiTokens();
    if (tokens.length > 0) return tokens;
    return props.tokens ?? [];
  });

  const filtered = createMemo(() => {
    return baseTokens().filter((tk) => {
      if (activeChain() !== "All Chains" && tk.chain !== activeChain()) return false;
      if (!searchResults() && searchQuery()) {
        const q = searchQuery().toLowerCase();
        if (!tk.symbol.toLowerCase().includes(q) && !tk.name.toLowerCase().includes(q)) return false;
      }
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
            <X size={18} />
          </button>
        </div>

        <div class={`tf-selector-search ${searchFocused() ? "tf-selector-search--focused" : ""}`}>
          <span class="tf-selector-search-icon"><Search size={14} /></span>
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
              const token = () => baseTokens().find((x) => x.symbol === sym && x.chain === "Ethereum");
              return (
                <Show when={token()}>
                  <button
                    class="tf-popular-token"
                    onClick={() => props.onSelect(token()!)}
                  >
                    <TokenIcon symbol={sym} color={token()!.color} size={20} logoURI={token()!.logoURI} />
                    <span class="tf-popular-token-name">{sym}</span>
                  </button>
                </Show>
              );
            }}
          </For>
        </div>

        <div class="tf-chain-filter">
          <button
            class={`tf-chain-filter-btn ${activeChain() === "All Chains" ? "tf-chain-filter-btn--active" : ""}`}
            onClick={() => setActiveChain("All Chains")}
          >
            <ChainDot size={7} />
            All Chains
          </button>
          <For each={chains()}>
            {(chain) => (
              <button
                class={`tf-chain-filter-btn ${activeChain() === chain.name ? "tf-chain-filter-btn--active" : ""}`}
                onClick={() => setActiveChain(chain.name)}
              >
                <ChainDot size={7} iconUrl={chainIconUrl(apiBase(), chain.chainId)} />
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
            const chainColor = () => null;
            return (
              <button
                class="tf-token-list-item"
                onClick={() => props.onSelect(token)}
              >
                <div class="tf-token-list-left">
                  <div class="tf-token-list-icon-wrap">
                    <TokenIcon symbol={token.symbol} color={token.color} size={36} logoURI={token.logoURI} />
                    <div class="tf-token-list-chain-indicator">
                      <ChainDot color={chainColor()} size={9} iconUrl={chainIconUrl(apiBase(), token.chainId)} />
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
