export const lightVars: Record<string, string> = {
  "--tf-font": "'DM Sans', system-ui, -apple-system, sans-serif",
  "--tf-font-mono": "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace",
  "--tf-bg": "#ffffff",
  "--tf-bg-secondary": "#f8f9fb",
  "--tf-surface": "#ffffff",
  "--tf-surface-hover": "#f3f4f8",
  "--tf-text": "#0f1419",
  "--tf-text-secondary": "#5e6673",
  "--tf-text-tertiary": "#9ba3af",
  "--tf-border": "#e8eaef",
  "--tf-border-light": "#f0f1f5",
  "--tf-accent": "#6C5CE7",
  "--tf-accent-light": "rgba(108,92,231,0.08)",
  "--tf-accent-glow": "rgba(108,92,231,0.15)",
  "--tf-success": "#00C48C",
  "--tf-success-bg": "rgba(0,196,140,0.08)",
  "--tf-error": "#FF4757",
  "--tf-error-bg": "rgba(255,71,87,0.08)",
  "--tf-warning": "#FFAA00",
  "--tf-shadow": "0 2px 16px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1)",
  "--tf-shadow-lg":
    "0 8px 40px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)",
  "--tf-input-bg": "#f5f6f8",
  "--tf-glass": "rgba(255,255,255,0.7)",
  "--tf-skeleton": "#e8eaef",
};

export const darkVars: Record<string, string> = {
  "--tf-font": "'DM Sans', system-ui, -apple-system, sans-serif",
  "--tf-font-mono": "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace",
  "--tf-bg": "#0d0f14",
  "--tf-bg-secondary": "#141720",
  "--tf-surface": "#181b25",
  "--tf-surface-hover": "#1e2230",
  "--tf-text": "#eef0f6",
  "--tf-text-secondary": "#8b93a5",
  "--tf-text-tertiary": "#555d6e",
  "--tf-border": "#252a38",
  "--tf-border-light": "#1e2230",
  "--tf-accent": "#8B7CF6",
  "--tf-accent-light": "rgba(139,124,246,0.1)",
  "--tf-accent-glow": "rgba(139,124,246,0.2)",
  "--tf-success": "#34D399",
  "--tf-success-bg": "rgba(52,211,153,0.1)",
  "--tf-error": "#F87171",
  "--tf-error-bg": "rgba(248,113,113,0.1)",
  "--tf-warning": "#FBBF24",
  "--tf-shadow": "0 2px 16px rgba(0,0,0,0.3), 0 0 1px rgba(0,0,0,0.5)",
  "--tf-shadow-lg":
    "0 8px 40px rgba(0,0,0,0.4), 0 0 1px rgba(0,0,0,0.5)",
  "--tf-input-bg": "#141720",
  "--tf-glass": "rgba(13,15,20,0.7)",
  "--tf-skeleton": "#252a38",
};

export function getThemeVars(
  theme: "light" | "dark" | "auto"
): Record<string, string> {
  if (theme === "auto") {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ) {
      return darkVars;
    }
    return lightVars;
  }
  return theme === "dark" ? darkVars : lightVars;
}

export function buildCssVarString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join("\n  ");
}

export function applyCustomColors(
  el: HTMLElement,
  colors: Record<string, string>
): void {
  const colorMap: Record<string, string> = {
    primary: "--tf-accent",
    background: "--tf-bg",
    textPrimary: "--tf-text",
    textSecondary: "--tf-text-secondary",
    border: "--tf-border",
    success: "--tf-success",
    error: "--tf-error",
    warning: "--tf-warning",
  };

  for (const [key, value] of Object.entries(colors)) {
    const cssVar = colorMap[key] ?? `--tf-${key}`;
    el.style.setProperty(cssVar, value);
  }
}
