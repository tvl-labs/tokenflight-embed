import { createSignal, For, Show, createMemo, onMount, createEffect } from "solid-js";
import { TokenIcon, ChainBadge, ChainDot, chainIconUrl, X, Search } from "./icons";
import { t } from "../i18n";
import type { HyperstreamApi } from "../api/hyperstream-api";
import type { TokenInfo } from "../types/api";
import { toDisplayAmount, formatDisplayAmount } from "../helpers/amount-utils";
import { loadChains, getChainDisplay, type ChainDisplay } from "../services/chain-registry";
import { primeTokenCaches } from "../services/token-resolver";
import { createTokenBalancesQuery, createTokenListQuery } from "../queries/queries";

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
  priceUsd?: number;
}

const POPULAR_TOKENS = ["USDC", "ETH", "USDT", "WBTC"];

function formatUsdValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0.00";
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

function apiTokenToItem(token: TokenInfo): TokenItem {
  const normalizedChainId = Number(token.chainId);
  const chainId = Number.isFinite(normalizedChainId) ? normalizedChainId : 0;
  const chainInfo = chainId > 0 ? getChainDisplay(chainId) : undefined;
  const decimals = typeof token.decimals === "number" && token.decimals >= 0 ? token.decimals : 18;
  const balanceRaw = token.extensions?.balance ?? "0";
  const hasBalance = balanceRaw !== "0";
  const balance = hasBalance
    ? formatDisplayAmount(toDisplayAmount(balanceRaw, decimals), 4)
    : "0";

  const unitPrice = Number(token.extensions?.price?.usd ?? "");
  const amount = Number(toDisplayAmount(balanceRaw, decimals));
  const usdValue =
    Number.isFinite(unitPrice) && Number.isFinite(amount)
      ? amount * unitPrice
      : 0;

  return {
    symbol: token.symbol,
    name: token.name,
    chain: chainInfo?.name ?? (chainId > 0 ? `Chain ${chainId}` : "Unknown Chain"),
    chainId,
    color: "#888",
    balance,
    usd: formatUsdValue(usdValue),
    address: token.address,
    decimals,
    logoURI: token.logoURI,
    priceUsd: Number.isFinite(unitPrice) ? unitPrice : undefined,
  };
}

export interface TokenSelectorProps {
  tokens?: TokenItem[];
  client?: HyperstreamApi | null;
  walletAddress?: string | null;
  selectingFor: "from" | "to";
  onSelect: (token: TokenItem) => void;
  onClose: () => void;
}

export function TokenSelector(props: TokenSelectorProps) {
  const isFromSelector = () => props.selectingFor === "from";
  const [searchQuery, setSearchQuery] = createSignal("");
  const [activeChain, setActiveChain] = createSignal("All Chains");
  const [searchFocused, setSearchFocused] = createSignal(false);
  const [searchResults, setSearchResults] = createSignal<TokenInfo[] | null>(null);
  const [chains, setChains] = createSignal<ChainDisplay[]>([]);
  const apiBase = () => props.client?.baseUrl;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  // Load top tokens via solid-query (auto-cached, 5min stale)
  const tokenListQuery = createTokenListQuery(
    () => props.client ?? null,
    () => !!props.client && !isFromSelector(),
  );

  // Load wallet balances for FROM selector (auto-cached, 30s stale)
  const tokenBalancesQuery = createTokenBalancesQuery(
    () => props.client ?? null,
    () => props.walletAddress ?? null,
    () => !!props.client && isFromSelector() && !!props.walletAddress,
  );

  const chainCount = createMemo(() => chains().length);

  const topTokens = createMemo(() => {
    chainCount();
    const data = tokenListQuery.data;
    return data ? data.map(apiTokenToItem) : [];
  });

  const balanceTokens = createMemo(() => {
    chainCount();
    const data = tokenBalancesQuery.data;
    return data ? data.map(apiTokenToItem) : [];
  });

  const mappedSearchResults = createMemo(() => {
    chainCount();
    const data = searchResults();
    return data ? data.map(apiTokenToItem) : null;
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

    if (isFromSelector() || !query || !props.client) {
      setSearchResults(null);
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const result = await props.client!.searchTokens(query);
        setSearchResults(result.data);
      } catch {
        setSearchResults(null);
      }
    }, 300);
  });

  const baseTokens = createMemo(() => {
    if (mappedSearchResults() !== null) return mappedSearchResults()!;
    const tokens = isFromSelector() ? balanceTokens() : topTokens();
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

  const handleSelect = (token: TokenItem) => {
    if (token.address) {
      primeTokenCaches({
        chainId: token.chainId,
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI,
        priceUsd: token.priceUsd,
      });
    }
    props.onSelect(token);
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
                    onClick={() => handleSelect(token()!)}
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
            <ChainDot size={14} />
            All Chains
          </button>
          <For each={chains()}>
            {(chain) => (
              <button
                class={`tf-chain-filter-btn ${activeChain() === chain.name ? "tf-chain-filter-btn--active" : ""}`}
                onClick={() => setActiveChain(chain.name)}
              >
                <ChainDot size={14} iconUrl={chainIconUrl(apiBase(), chain.chainId)} />
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
                onClick={() => handleSelect(token)}
              >
                <div class="tf-token-list-left">
                  <div class="tf-token-list-icon-wrap">
                    <TokenIcon symbol={token.symbol} color={token.color} size={36} logoURI={token.logoURI} />
                    <div class="tf-token-list-chain-indicator">
                      <ChainDot color={chainColor()} size={11} iconUrl={token.chainId > 0 ? chainIconUrl(apiBase(), token.chainId) : undefined} />
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
