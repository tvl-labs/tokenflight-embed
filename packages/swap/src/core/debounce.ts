import { createSignal, onCleanup } from "solid-js";

/**
 * Creates a debounced signal.
 * Returns [debouncedValue, setImmediateValue].
 * Updates to debouncedValue are delayed by `delayMs` milliseconds.
 */
export function createDebounced<T>(
  initialValue: T,
  delayMs: number = 500
): [() => T, (value: T) => void] {
  const [debouncedValue, setDebouncedValue] = createSignal<T>(initialValue);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const setValue = (value: T) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      setDebouncedValue(() => value);
      timer = null;
    }, delayMs);
  };

  onCleanup(() => {
    if (timer !== null) {
      clearTimeout(timer);
    }
  });

  return [debouncedValue, setValue];
}
