import { Show, Switch, Match } from "solid-js";
import type { SwapPhase } from "../types/state";
import { t } from "../i18n";
import { Check, X } from "./icons";

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
          <Check size={18} />
          {props.label ?? t("swap.success")}
        </div>
      </Match>
      <Match when={props.phase === "error"}>
        <button class="tf-btn-error" part="button-primary" onClick={props.onRetry}>
          <X size={16} />
          {t("swap.error.generic")}
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
      <Match when={props.phase === "idle" || props.phase === "quoting" || props.phase === "quoted"}>
        <button class="tf-btn-primary" part="button-primary" disabled style={{ opacity: 0.6 }}>
          {t("swap.reviewSwap")}
        </button>
      </Match>
    </Switch>
  );
}
