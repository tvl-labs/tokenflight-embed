import { Show, Switch, Match } from "solid-js";
import type { SwapPhase } from "../types/state";
import { t } from "../i18n";

export interface ActionButtonProps {
  phase: SwapPhase;
  isConnected: boolean;
  hasQuote: boolean;
  onConnect: () => void;
  onConfirm: () => void;
  onRetry: () => void;
  label?: string;
}

export function ActionButton(props: ActionButtonProps) {
  return (
    <Switch>
      <Match when={props.phase === "success"}>
        <div class="tf-btn-success" part="button-primary">
          <span style={{ "font-size": "18px" }}>{"\u2713"}</span>
          {props.label ?? t("swap.success")}
        </div>
      </Match>
      <Match when={props.phase === "error"}>
        <button class="tf-btn-error" part="button-primary" onClick={props.onRetry}>
          <span style={{ "font-size": "16px" }}>{"\u2715"}</span>
          {t("swap.error.slippage")}
        </button>
      </Match>
      <Match when={!props.isConnected}>
        <button class="tf-btn-connect" part="button-secondary" onClick={props.onConnect}>
          {t("swap.connectWallet")}
        </button>
      </Match>
      <Match when={props.phase === "submitting" || props.phase === "building" || props.phase === "awaiting-wallet" || props.phase === "tracking"}>
        <button class="tf-btn-primary tf-btn-primary--executing" part="button-primary" disabled>
          <span class="tf-btn-inner">
            <span class="tf-spinner" />
            {t("swap.executing")}
          </span>
        </button>
      </Match>
      <Match when={props.hasQuote}>
        <button class="tf-btn-primary" part="button-primary" onClick={props.onConfirm}>
          {props.label ?? t("swap.confirmSwap")}
        </button>
      </Match>
      <Match when={true}>
        <button class="tf-btn-primary" part="button-primary" disabled style={{ opacity: 0.6 }}>
          {t("swap.reviewSwap")}
        </button>
      </Match>
    </Switch>
  );
}
