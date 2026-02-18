import { createSignal, onCleanup } from "solid-js";
import { t } from "../i18n";

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function AmountInput(props: AmountInputProps) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const [localValue, setLocalValue] = createSignal(props.value);

  const handleInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    let val = input.value;

    // Only allow numbers and one decimal point
    val = val.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }

    setLocalValue(val);

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      props.onChange(val);
    }, 500);
  };

  onCleanup(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  return (
    <input
      type="text"
      inputmode="decimal"
      class="tf-amount"
      value={localValue()}
      onInput={handleInput}
      disabled={props.disabled}
      placeholder={props.placeholder ?? t("amount.zero")}
      part="input"
    />
  );
}
