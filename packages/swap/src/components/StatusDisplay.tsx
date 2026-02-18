import { Show } from "solid-js";
import { t } from "../i18n";

export interface StatusDisplayProps {
  txHash?: string;
  explorerUrl?: string;
}

export function StatusDisplay(props: StatusDisplayProps) {
  const url = () => {
    if (props.explorerUrl && props.txHash) {
      return `${props.explorerUrl}/tx/${props.txHash}`;
    }
    return null;
  };

  return (
    <Show when={url()}>
      <div class="tf-explorer-link" part="status-message">
        <a href={url()!} target="_blank" rel="noopener noreferrer">
          {t("swap.viewExplorer")} {"\u2197"}
        </a>
      </div>
    </Show>
  );
}
