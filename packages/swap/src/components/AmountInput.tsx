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
    const dotIndex = val.indexOf(".");
    if (dotIndex !== -1) {
      val = val.slice(0, dotIndex + 1) + val.slice(dotIndex + 1).replace(/\./g, "");
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
