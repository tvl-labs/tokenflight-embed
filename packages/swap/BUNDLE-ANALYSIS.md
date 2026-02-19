# @tokenflight/swap Bundle Size Analysis

**Date**: 2026-02-19
**Version**: 1.2.0
**Target**: ≤ 70 KB gzip (JS only, per CLAUDE.md)

---

## Current Build Output

| File | Raw | Gzip |
|------|-----|------|
| `tokenflight-swap.js` (ESM) | 340.74 KB | **74.40 KB** |
| `tokenflight-swap.umd.cjs` (UMD) | 180.94 KB | **53.40 KB** |
| `zh-CN-*.js` | 1.66 KB | 0.82 KB |
| `zh-TW-*.js` | 1.66 KB | 0.81 KB |
| `ko-KR-*.js` | 1.77 KB | 0.84 KB |
| `ja-JP-*.js` | 1.95 KB | 0.92 KB |

**Total transfer size (gzip)**: ~78 KB (JS 74 KB + i18n chunks ~3 KB)

> Fonts are no longer bundled. The widget uses CSS custom properties (`--tf-font`, `--tf-font-mono`) with system font fallbacks. Users can load their own fonts and override these variables. See the [theming docs](/guides/theming/#custom-fonts).

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

## Optimization Opportunities

### 1. Replace `ky` with native `fetch` wrapper (saves ~44 KB minified / ~10 KB gzip)

`ky` is a full-featured HTTP client (44.21 KB minified) but only used in one file (`api/hyperstream-api.ts`). A thin `fetch` wrapper with retry and timeout would cover the same needs at <2 KB. This is the single largest actionable saving.

### 2. Replace `@tanstack/solid-query` with lightweight reactive queries (saves ~80 KB minified / ~18 KB gzip)

TanStack Query Core alone is 73.54 KB minified. The SDK uses `createQuery` for 3-4 queries (balances, orders, tokens). A lightweight custom reactive query layer using Solid.js signals (which is already bundled) could replace this at ~3-5 KB. This is the largest dependency but also the most effort to replace.

### 3. Externalize `solid-js` (saves ~54 KB minified / ~12 KB gzip)

If consumers are already using Solid.js, marking it as an external peer dependency would eliminate it from the bundle. However, since this is a Web Component SDK consumed by non-Solid apps, this isn't viable for the standalone use case. Could be offered as a separate "slim" build.

### 4. Deduplicate SwapComponent / ReceiveComponent (saves ~10-15 KB estimated)

These two components are 24.4 KB and 19.0 KB respectively with significant structural overlap. Extracting shared logic into a base component could reduce total size.

---

## Priority Ranking (effort vs. impact)

| Priority | Optimization | Gzip Savings | Effort |
|----------|-------------|-------------|--------|
| 1 | Replace `ky` with `fetch` wrapper | ~10 KB | Low |
| 2 | Replace TanStack Query | ~18 KB | High |
| 3 | Deduplicate Swap/Receive components | ~3-5 KB | Medium |
| 4 | Externalize solid-js (slim build) | ~12 KB | Medium |

### Realistic target with optimization #1:
- JS: ~64 KB gzip (from 74 KB, -10 KB from ky removal)
- **Total: ~67 KB gzip** (under 70 KB target)

### Aggressive target with all optimizations:
- JS: ~34 KB gzip
- **Total: ~37 KB gzip**

> **Note**: The current 74.4 KB gzip is just slightly over the 70 KB target. Replacing `ky` with a native `fetch` wrapper alone would bring it under target at ~64 KB gzip.
