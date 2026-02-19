# @tokenflight/swap Bundle Size Analysis

**Date**: 2026-02-19
**Version**: 1.2.0
**Target**: ≤ 30 KB gzip (JS only, per CLAUDE.md)

---

## Current Build Output

| File | Raw | Gzip |
|------|-----|------|
| `tokenflight-swap.js` (ESM) | 340.64 KB | **74.36 KB** |
| `tokenflight-swap.umd.cjs` (UMD) | 180.86 KB | **53.36 KB** |
| `tokenflight-swap.css` (Fonts + styles) | 349.19 KB | **261.85 KB** |
| `zh-CN-*.js` | 1.66 KB | 0.82 KB |
| `zh-TW-*.js` | 1.66 KB | 0.81 KB |
| `ko-KR-*.js` | 1.77 KB | 0.84 KB |
| `ja-JP-*.js` | 1.95 KB | 0.92 KB |

**Total transfer size (gzip)**: ~393 KB (JS 74 KB + CSS 262 KB + i18n chunks ~3 KB)

---

## JS Bundle Breakdown (ESM, 340 KB minified)

### By Category

| Category | Minified | % of Total |
|----------|----------|-----------|
| **src: components** | 83.06 KB | 24.4% |
| **dep: @tanstack/query-core** | 73.54 KB | 21.6% |
| **dep: solid-js** (core + web + store) | 53.60 KB | 15.8% |
| **dep: ky** (HTTP client) | 44.21 KB | 13.0% |
| src: styles (CSS-in-JS) | 20.65 KB | 6.1% |
| src: i18n (en-US, embedded) | 9.38 KB | 2.8% |
| src: api | 8.71 KB | 2.6% |
| src: services | 7.77 KB | 2.3% |
| dep: @tanstack/solid-query | 6.70 KB | 2.0% |
| src: other (register, index, types) | 6.68 KB | 2.0% |
| src: helpers | 6.55 KB | 1.9% |
| dep: component-register (solid-element dep) | 6.07 KB | 1.8% |
| src: state | 5.53 KB | 1.6% |
| dep: lucide-solid (7 icons) | 4.67 KB | 1.4% |
| dep: solid-element | 1.30 KB | 0.4% |
| src: queries | 1.77 KB | 0.5% |

### High-Level Split

| | Minified | % |
|-|----------|---|
| **Application code** | 150.10 KB | 44.1% |
| **Dependencies** | 190.09 KB | 55.9% |

### Top 10 Largest Individual Modules

| Module | Minified |
|--------|----------|
| `components/SwapComponent.tsx` | 24.40 KB |
| `solid-js/dist/solid.js` | 24.09 KB |
| `ky/distribution/core/Ky.js` | 19.41 KB |
| `solid-js/web/dist/web.js` | 19.10 KB |
| `components/ReceiveComponent.tsx` | 18.95 KB |
| `styles/base.ts` | 18.18 KB |
| `components/TokenSelector.tsx` | 15.83 KB |
| `@tanstack/query-core/queryObserver.js` | 15.61 KB |
| `@tanstack/query-core/query.js` | 12.07 KB |
| `solid-js/store/dist/store.js` | 10.42 KB |

---

## CSS / Font Analysis

The CSS file is **99.7% embedded font data** (base64 woff2):

| Content | Size |
|---------|------|
| Font data URIs (base64 woff2) | ~348 KB |
| Actual CSS styles | ~1 KB |

**Fonts imported in `src/index.ts`:**
- `@fontsource/dm-sans` — 5 weights (300, 400, 500, 600, 700) → ~70 KB woff2
- `@fontsource/jetbrains-mono` — 2 weights (400, 500) → ~43 KB woff2

These woff2 files are inlined as base64 by Vite, expanding ~33% over raw binary size.

**Actual font weights used in styles:**
- DM Sans: 300, 400, 500, 600, 700 (all imported weights are used)
- JetBrains Mono: 400, 500 (both imported weights are used)

---

## Optimization Opportunities

### 1. Replace `ky` with native `fetch` wrapper (saves ~44 KB minified / ~10 KB gzip)

`ky` is a full-featured HTTP client (44.21 KB minified) but only used in one file (`api/hyperstream-api.ts`). A thin `fetch` wrapper with retry and timeout would cover the same needs at <2 KB. This is the single largest actionable saving.

### 2. Replace `@tanstack/solid-query` with lightweight reactive queries (saves ~80 KB minified / ~18 KB gzip)

TanStack Query Core alone is 73.54 KB minified. The SDK uses `createQuery` for 3-4 queries (balances, orders, tokens). A lightweight custom reactive query layer using Solid.js signals (which is already bundled) could replace this at ~3-5 KB. This is the largest dependency but also the most effort to replace.

### 3. Externalize `solid-js` (saves ~54 KB minified / ~12 KB gzip)

If consumers are already using Solid.js, marking it as an external peer dependency would eliminate it from the bundle. However, since this is a Web Component SDK consumed by non-Solid apps, this isn't viable for the standalone use case. Could be offered as a separate "slim" build.

### 4. Switch fonts from inline to CDN/external (saves ~262 KB gzip CSS)

Replace `@fontsource` base64 imports with:
- Google Fonts CDN `<link>` tags (zero CSS bundle cost, additional HTTP request)
- Or `@font-face` declarations with `url()` pointing to a CDN (user-configurable)
- Or make fonts optional/opt-in for the host page to provide

### 5. Reduce font weights (saves ~30 KB CSS if applicable)

Currently importing DM Sans 300/400/500/600/700 and JetBrains Mono 400/500. All are referenced in styles. If the design can consolidate to fewer weights (e.g., DM Sans 400/500/600 only), some savings are possible.

### 6. Deduplicate SwapComponent / ReceiveComponent (saves ~10-15 KB estimated)

These two components are 24.4 KB and 19.0 KB respectively with significant structural overlap. Extracting shared logic into a base component could reduce total size.

---

## Priority Ranking (effort vs. impact)

| Priority | Optimization | Gzip Savings | Effort |
|----------|-------------|-------------|--------|
| 1 | Replace `ky` with `fetch` wrapper | ~10 KB | Low |
| 2 | Externalize fonts (CDN or opt-in) | ~262 KB (CSS) | Low |
| 3 | Replace TanStack Query | ~18 KB | High |
| 4 | Deduplicate Swap/Receive components | ~3-5 KB | Medium |
| 5 | Externalize solid-js (slim build) | ~12 KB | Medium |

### Realistic target with optimizations #1 + #2:
- JS: ~64 KB gzip (from 74 KB, -10 KB from ky removal)
- CSS: <1 KB gzip (from 262 KB, fonts externalized)
- **Total: ~65 KB gzip** (from ~336 KB)

### Aggressive target with all optimizations:
- JS: ~34 KB gzip
- CSS: <1 KB gzip
- **Total: ~35 KB gzip**

> **Note**: The CLAUDE.md target of ≤ 30 KB gzip for JS is not achievable without either externalizing solid-js or replacing TanStack Query (or both).
