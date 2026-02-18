import { createSignal } from "solid-js";
import { enUS } from "./en-US";

type Translations = Record<string, string>;

const [currentLocale, setCurrentLocaleSignal] = createSignal("en-US");
const [translations, setTranslations] = createSignal<Translations>(enUS);

const localeLoaders: Record<string, () => Promise<{ default: Translations }>> =
  {
    "zh-CN": () => import("./zh-CN"),
    "zh-TW": () => import("./zh-TW"),
    "ja-JP": () => import("./ja-JP"),
    "ko-KR": () => import("./ko-KR"),
  };

export async function setLocale(locale: string): Promise<void> {
  if (locale === "en-US" || locale === "en") {
    setCurrentLocaleSignal("en-US");
    setTranslations(enUS);
    return;
  }

  const loader = localeLoaders[locale];
  if (loader) {
    const module = await loader();
    setCurrentLocaleSignal(locale);
    setTranslations(module.default);
  } else {
    // Fallback to en-US
    setCurrentLocaleSignal("en-US");
    setTranslations(enUS);
  }
}

/**
 * Translate a key with optional parameter interpolation.
 * Parameters are replaced in the format {paramName}.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = translations();
  let text = dict[key] ?? enUS[key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return text;
}

export function formatNumber(
  value: number | string,
  options?: Intl.NumberFormatOptions
): string {
  const locale = currentLocale();
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat(locale, options).format(num);
}

export { currentLocale };
