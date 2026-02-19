import { createSignal } from "solid-js";
import ArrowDown from "lucide-solid/icons/arrow-down";
import ChevronDown from "lucide-solid/icons/chevron-down";
import ArrowRight from "lucide-solid/icons/arrow-right";
import Check from "lucide-solid/icons/check";
import X from "lucide-solid/icons/x";
import ExternalLink from "lucide-solid/icons/external-link";
import Search from "lucide-solid/icons/search";

export { ArrowDown, ChevronDown, ArrowRight, Check, X, ExternalLink, Search };

export function chainIconUrl(apiEndpoint: string | undefined | null, chainId: number): string | undefined {
  if (!apiEndpoint) return undefined;
  return `${apiEndpoint.replace(/\/$/, "")}/v1/chains/${chainId}/icon`;
}

export function AirplaneLogo(props: { size?: number }) {
  const size = () => props.size ?? 28;
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width={size()} height={size()}>
      <g transform="translate(32 32) rotate(0) scale(0.72) translate(-32 -32)">
        <g fill="#acb8bf">
          <path d="M7.212 12.752l8.132-8.132l1.98 1.98l-8.132 8.132z" />
          <path d="M21.421 14.797l8.133-8.13l1.98 1.98l-8.133 8.13z" />
          <path d="M49.31 54.854l8.134-8.13l1.98 1.981l-8.134 8.13z" />
          <path d="M47.279 40.557l8.134-8.13l1.98 1.981l-8.135 8.13z" />
        </g>
        <path d="M56.4 60.7l-4.7-42.1l-6.3-6.3L3.3 7.6c-2-.2-1.6 4.8.7 5.9l31.7 14.8L50.5 60c1.1 2.3 6.1 2.7 5.9.7" fill="#42ade2" />
        <path d="M61.3 8.1c2.2-4.3-1.1-7.6-5.4-5.4c-5.5 2.8-13.6 9.1-21.8 17.2c-12.8 12.8-21 25.5-18.3 28.3c2.7 2.7 15.5-5.5 28.3-18.3c8.1-8.1 14.4-16.3 17.2-21.8" fill="#dae3ea" />
        <path d="M22.4 60.2l-1.6-14.8l-2.2-2.2l-14.8-1.6c-.7-.1-.6 1.7.2 2.1l11.1 5.2L20.3 60c.4.8 2.2.9 2.1.2" fill="#42ade2" />
        <path d="M20.2 46.2c-4.5 4.5-8.6 7.6-9.2 6.9c-.6-.6 2.5-4.8 6.9-9.3c4.5-4.5 8.6-7.6 9.3-6.9c.5.6-2.6 4.8-7 9.3" fill="#acb8bf" />
        <path d="M59.8 9.7c.5-1.8.3-3.5-.8-4.7c-1.1-1.1-2.9-1.4-4.6-.8L51 6.3c1.7-.6 4.2.3 5.3 1.4c1.2 1.2 2 3.6 1.4 5.3l2.1-3.3" fill="#3e4347" />
        <path fill="#dae3ea" d="M53.664 9.695l5.654-5.659l.637.636l-5.655 5.66z" />
      </g>
    </svg>
  );
}

export function KhalaniLogo(props: { size?: number }) {
  const size = () => props.size ?? 16;
  return (
    <svg viewBox="-2 0 34 34" width={size()} height={size()} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="34" height="34" x="-2" fill="#00DDFF" />
      <path d="M10.8123 17.6719C10.8973 17.6718 10.9824 17.6716 11.0674 17.6715C11.2445 17.6713 11.4215 17.6716 11.5986 17.6721C11.825 17.6729 12.0514 17.6724 12.2778 17.6717C12.453 17.6713 12.6281 17.6714 12.8033 17.6717C12.8868 17.6718 12.9703 17.6717 13.0538 17.6714C13.1703 17.6711 13.2869 17.6717 13.4035 17.6723C13.4696 17.6724 13.5357 17.6725 13.6039 17.6726C13.7898 17.6887 13.9208 17.7356 14.0903 17.8109C14.1548 17.8248 14.2194 17.8387 14.2859 17.8531C14.8546 18.0131 15.3063 18.5095 15.7089 18.9168C15.7897 18.9974 15.7897 18.9974 15.8722 19.0796C16.0182 19.2255 16.1638 19.3717 16.3092 19.5182C16.4624 19.6723 16.6161 19.8259 16.7697 19.9796C17.0275 20.2376 17.2849 20.4959 17.542 20.7545C17.8709 21.0851 18.2003 21.4152 18.5299 21.7451C18.815 22.0303 19.0998 22.3159 19.3845 22.6015C19.4753 22.6925 19.5661 22.7835 19.6569 22.8745C19.8268 23.0447 19.9964 23.2153 20.1661 23.3859C20.2158 23.4357 20.2655 23.4854 20.3167 23.5367C20.5729 23.7949 20.8198 24.0575 21.0564 24.3339C21.1875 24.4846 21.3284 24.6242 21.4711 24.7639C21.5279 24.8199 21.5846 24.8759 21.6431 24.9336C21.7316 25.0205 21.8202 25.1074 21.909 25.1941C21.9959 25.2793 22.0825 25.3648 22.1691 25.4504C22.246 25.5257 22.246 25.5257 22.3245 25.6026C22.4359 25.727 22.4359 25.727 22.4359 25.8497C21.7968 25.8569 21.1577 25.8623 20.5186 25.8656C20.2217 25.8672 19.9248 25.8694 19.6279 25.8729C19.3407 25.8762 19.0534 25.8781 18.7661 25.8788C18.6573 25.8794 18.5485 25.8805 18.4397 25.8822C17.2247 25.9001 16.3482 25.6479 15.4572 24.7829C15.3297 24.6562 15.2035 24.5283 15.0774 24.4002C15.0095 24.332 14.9416 24.2638 14.8736 24.1957C14.6967 24.018 14.5203 23.8398 14.344 23.6615C14.1314 23.4467 13.9182 23.2326 13.705 23.0184C13.3829 22.6945 13.0616 22.3697 12.7402 22.0451C12.72 23.3006 12.6997 24.5561 12.6789 25.8497C11.1398 25.8497 9.60078 25.8497 8.0151 25.8497C8.01018 24.3809 8.01018 24.3809 8.00911 23.751C8.00838 23.3225 8.00752 22.894 8.00584 22.4655C8.0045 22.1197 8.00377 21.774 8.00346 21.4282C8.00323 21.2968 8.00279 21.1654 8.00212 21.034C7.99195 18.9428 7.99195 18.9428 8.65177 18.2519C9.27422 17.6629 9.99189 17.6693 10.8123 17.6719Z" fill="black" />
      <path d="M8.98145 8.11694C10.4597 8.11694 11.938 8.11694 13.4611 8.11694C13.4649 8.77255 13.4687 9.42817 13.4726 10.1036C13.4751 10.4124 13.4751 10.4124 13.4777 10.7275C13.4782 10.892 13.4787 11.0566 13.4791 11.2212C13.4796 11.2631 13.48 11.3051 13.4805 11.3483C13.491 12.3134 13.292 13.0044 12.6157 13.7163C12.5019 13.8305 12.3877 13.9438 12.2726 14.0567C12.211 14.118 12.1494 14.1794 12.0879 14.2408C11.9596 14.3686 11.831 14.496 11.702 14.6231C11.5379 14.7847 11.3745 14.947 11.2114 15.1095C11.054 15.2663 10.8963 15.4228 10.7385 15.5793C10.7091 15.6085 10.6797 15.6377 10.6494 15.6677C10.3392 15.9754 10.0267 16.2768 9.6943 16.5606C9.52059 16.7114 9.36479 16.879 9.20629 17.0453C9.10418 17.1376 9.10418 17.1376 8.98145 17.1376C8.98145 14.1608 8.98145 11.184 8.98145 8.11694Z" fill="black" />
      <path d="M15.5476 9.7738C15.7513 9.87564 15.8492 9.93702 16.0037 10.0896C16.0442 10.1293 16.0848 10.169 16.1265 10.2099C16.1703 10.2535 16.214 10.297 16.2591 10.3419C16.3058 10.3878 16.3524 10.4337 16.4004 10.481C16.5548 10.6332 16.7086 10.786 16.8624 10.9388C16.9151 10.9911 16.9679 11.0434 17.0222 11.0973C17.3015 11.3744 17.5805 11.652 17.8592 11.9298C18.1459 12.2155 18.4338 12.4999 18.7221 12.7839C18.9445 13.0036 19.166 13.2242 19.3872 13.4451C19.4928 13.5503 19.5988 13.6551 19.7052 13.7595C20.8275 14.8625 20.8275 14.8625 21.0705 15.6035C21.0705 16.0693 21.0705 16.535 21.0705 17.0149C19.2479 17.0149 17.4254 17.0149 15.5476 17.0149C15.5476 14.6253 15.5476 12.2358 15.5476 9.7738Z" fill="black" />
    </svg>
  );
}

const SYMBOL_MAP: Record<string, string> = {
  USDC: "$",
  ETH: "\u039E",
  USDT: "\u20AE",
  WBTC: "\u20BF",
  DAI: "\u25C8",
  ARB: "A",
  SOL: "\u25CE",
};

export function TokenIcon(props: { symbol: string; color: string; size?: number; logoURI?: string | null }) {
  const size = () => props.size ?? 36;
  const letter = () => SYMBOL_MAP[props.symbol] ?? props.symbol[0] ?? "?";
  const [imgError, setImgError] = createSignal(false);

  const showImg = () => !!props.logoURI && !imgError();

  return (
    <div
      class="tf-token-icon"
      style={{
        width: `${size()}px`,
        height: `${size()}px`,
        ...(!showImg()
          ? {
              background: `linear-gradient(135deg, ${props.color}, ${props.color}cc)`,
              "font-size": `${size() * 0.42}px`,
              "box-shadow": `0 2px 8px ${props.color}33`,
            }
          : {}),
      }}
    >
      {showImg() ? (
        <img
          src={props.logoURI!}
          alt={props.symbol}
          width={size()}
          height={size()}
          class="tf-token-icon-img"
          on:error={() => setImgError(true)}
        />
      ) : (
        letter()
      )}
    </div>
  );
}

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "#627EEA",
  Base: "#0052FF",
  Arbitrum: "#28A0F0",
  Solana: "#9945FF",
};

export function ChainBadge(props: { chain: string; compact?: boolean }) {
  const color = () => CHAIN_COLORS[props.chain] ?? "#666";
  return (
    <span
      class={`tf-chain-badge ${props.compact ? "tf-chain-badge--compact" : "tf-chain-badge--normal"}`}
      style={{
        background: `${color()}18`,
        color: color(),
      }}
    >
      {props.chain}
    </span>
  );
}

export function ChainDot(props: { color?: string | null; size?: number; iconUrl?: string }) {
  const size = () => props.size ?? 8;
  const [imgError, setImgError] = createSignal(false);
  const showImg = () => !!props.iconUrl && !imgError();

  return (
    <div
      class="tf-chain-dot"
      style={{
        width: `${size()}px`,
        height: `${size()}px`,
        ...(!showImg()
          ? {
              background: props.color
                ? props.color
                : "conic-gradient(#627EEA 0deg 90deg, #0052FF 90deg 180deg, #28A0F0 180deg 270deg, #9945FF 270deg 360deg)",
            }
          : {}),
      }}
    >
      {showImg() && (
        <img
          src={props.iconUrl!}
          alt=""
          width={size()}
          height={size()}
          class="tf-chain-dot-img"
          on:error={() => setImgError(true)}
        />
      )}
    </div>
  );
}

export function PoweredByKhalani() {
  return (
    <div class="tf-footer" part="fee-info">
      <span class="tf-footer-text">Powered by</span>
      <KhalaniLogo size={14} />
      <span class="tf-footer-brand">KHALANI</span>
      <span class="tf-footer-arrow"><ExternalLink size={10} /></span>
    </div>
  );
}
