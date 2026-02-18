# TokenFlight Swap SDK

Embeddable Web Components for cross-chain token swaps. Two components: `<tokenflight-swap>` (exact input amount) and `<tokenflight-receive>` (fixed output amount). Built with Solid.js + solid-element, compiled to Web Components with Shadow DOM.

## Monorepo Structure

- `packages/swap/` — core SDK (`@tokenflight/swap`), Solid.js + Vite
- `packages/adapter-{privy,appkit,thirdweb}/` — wallet adapter packages
- `apps/docs/` — Astro Starlight documentation site
- `e2e/` — Playwright E2E tests (config at root `playwright.config.ts`)
- `spec/` — product specifications (gitignored, Chinese & English)
- `tooling/` — shared assets (logos)

Package manager: **pnpm** (v9). Build orchestration: **Turborepo**.

## Commands

```sh
pnpm build                          # Build all packages (turbo)
npx turbo run build --force          # Force rebuild (NOT pnpm build -- --force)
pnpm test                            # Unit tests (Vitest)
pnpm lint                            # Lint (oxlint)
pnpm check-types                     # TypeScript type checking
pnpm e2e                             # Playwright E2E tests (build first!)
pnpm e2e:update                      # Update visual regression snapshots
```

## Architecture

### Core Source Layout (`packages/swap/src/`)

```
src/
├── components/       # Solid.js UI components
│   ├── SwapComponent.tsx       # <tokenflight-swap> main view
│   ├── ReceiveComponent.tsx    # <tokenflight-receive> main view
│   ├── TokenSelector.tsx       # Token picker modal (search + chain filter)
│   ├── PaymentTokenList.tsx    # Payment token list for receive mode
│   ├── QuotePreview.tsx        # Quote route details display
│   ├── ActionButton.tsx        # Primary CTA button (connect / swap / confirm)
│   ├── StatusDisplay.tsx       # Order tracking status UI
│   ├── AmountInput.tsx         # Amount input field
│   └── icons.tsx               # TokenIcon, ChainDot, ChainBadge, logos
├── core/             # Business logic (no UI dependencies)
│   ├── state-machine.ts        # Solid.js signal-based state machines
│   ├── khalani-client.ts       # HTTP client for Hyperstream API
│   ├── chain-registry.ts       # Chain list loader/cache from /v1/chains
│   ├── token-resolver.ts       # Token metadata resolution + cache
│   ├── rank-offers.ts          # Quote/route ranking algorithm
│   ├── amount-utils.ts         # BigInt ↔ display amount conversions
│   ├── caip10.ts               # CAIP-10 token identifier parsing
│   ├── validation.ts           # Config validation (valibot schemas)
│   ├── debounce.ts             # Utility
│   └── queries.ts              # Query helpers
├── types/            # TypeScript interfaces
│   ├── api.ts                  # API response types (TokenInfo, QuoteRoute, etc.)
│   ├── config.ts               # Widget config types (SwapConfig, ReceiveConfig)
│   ├── state.ts                # State machine types (SwapState, ReceiveState)
│   ├── wallet.ts               # IWalletAdapter interface
│   └── errors.ts               # Error types and codes
├── styles/           # CSS-in-JS
│   ├── base.ts                 # All component styles (single file)
│   └── theme.ts                # Light/dark theme CSS variables
├── i18n/             # Internationalization
│   ├── index.ts                # setLocale() / t() functions
│   ├── en-US.ts                # English (primary)
│   ├── zh-CN.ts                # Simplified Chinese
│   ├── zh-TW.ts                # Traditional Chinese
│   ├── ja-JP.ts                # Japanese
│   └── ko-KR.ts                # Korean
├── register.ts       # Web Component registration (solid-element)
└── index.ts          # Public API exports
```

### State Machine Flow

Both `<tokenflight-swap>` and `<tokenflight-receive>` share the same phase model:

```
idle → quoting → quoted → building → awaiting-wallet → submitting → tracking → success
  ↑                                                                               |
  └──────────────────────────── error ←───────────────────────────────────────────┘
```

Phase transitions are validated by `VALID_TRANSITIONS` map. Invalid transitions are silently rejected.

### API Lifecycle (Quote → Build → Submit → Track)

1. **Quote**: `POST /v1/quotes` (supports `?mode=stream` for SSE streaming)
2. **Build**: `POST /v1/deposit/build` — returns wallet actions to execute
3. **Submit**: `PUT /v1/deposit/submit` — sends tx hash, creates order
4. **Track**: `GET /v1/orders/:address` — poll for order status

### Web Component Registration

`register.ts` maps HTML attributes to config props via solid-element:
- `<tokenflight-swap api-endpoint="..." from-token="..." to-token="..." theme="..." locale="...">`
- `<tokenflight-receive api-endpoint="..." target="..." amount="..." theme="..." locale="...">`

Token identifiers accept CAIP-10 (`eip155:1:0xA0b8...`), JSON, or `{chainId, address}` objects.

### Wallet Adapter Interface

All adapters implement `IWalletAdapter` from `types/wallet.ts`:
- `connect(chainType?)` / `disconnect()` / `isConnected()`
- `getAddress(chainType?)` — returns current wallet address
- `executeWalletAction(action)` — handles EVM (EIP-1193) and Solana tx signing
- `on(event, handler)` / `off(event, handler)` — wallet event subscriptions

### Icons & Logos

Token and chain icons follow a **API-first with fallback** strategy:
- `TokenIcon`: renders `<img>` from `logoURI` (from `/v1/tokens`); falls back to Unicode symbol map
- `ChainDot`: renders `<img>` from `/v1/chains/:chainId/icon`; falls back to colored dot
- Both handle `on:error` to gracefully degrade when images fail to load

## Critical Conventions

### Shadow DOM + Solid.js Events
Solid's `onKeyDown`/`onClick` etc. use event delegation attached to the document root. Events inside Shadow DOM don't bubble past the shadow boundary. **Always use `on:keydown` (lowercase, colon syntax)** for native event listeners inside Shadow DOM components.

### Build
- **Do NOT** add `/** @jsxImportSource solid-js */` pragma — vite-plugin-solid handles JSX transformation. `tsconfig.json` `jsxImportSource` is sufficient.
- `npx turbo run build --force` for forced rebuilds. `pnpm build -- --force` passes `--force` to Vite which doesn't accept it.
- `terser` must be an explicit devDependency in `packages/swap/` (Vite v6+ requires it).
- Bundle size target: **≤ 30 KB gzip** (ESM and UMD outputs). Current: ~30.7 KB ESM, ~25.8 KB UMD.

### CSS
- All CSS classes are prefixed with `tf-`: `.tf-footer`, `.tf-pay-token`, `.tf-best-badge`, `.tf-browse-all`, `.tf-pay-token--disabled`, etc.
- All styles live in `styles/base.ts` as a single template literal — **do not split** into multiple CSS files.
- Use BEM-like modifier pattern: `.tf-component--modifier` (e.g. `.tf-token-btn--select`, `.tf-chain-badge--compact`).
- Theme-aware colors use CSS custom properties: `var(--tf-bg)`, `var(--tf-text-primary)`, `var(--tf-border)`, etc. Defined in `styles/theme.ts`.

### Components
- Components are pure Solid.js (not Web Components themselves). Only `register.ts` creates custom elements.
- Props interfaces are defined inline in the component file (e.g. `SwapComponentProps`).
- Each top-level component (`SwapComponent`, `ReceiveComponent`) creates its own state machine and API client.
- Data caching (chains, tokens) is handled at the module level in `core/` — shared across instances.

### API Client
- `KhalaniClient` in `core/khalani-client.ts` wraps all API calls with error handling and timeouts.
- Client is constructed from `apiEndpoint` config prop; `baseUrl` is publicly accessible for URL construction.
- Streaming quotes use `EventSource` / SSE.

### i18n
- All user-facing strings must go through `t("key.path")` from `i18n/index.ts`.
- When adding new UI text, add keys to **all 5 locale files** (en-US, zh-CN, zh-TW, ja-JP, ko-KR).
- Key naming: dot-separated, grouped by component/feature (e.g. `swap.balance`, `receive.youReceive`, `selector.search`).

## Testing

- **Unit tests**: Vitest + jsdom, files in `packages/swap/src/__tests__/`
- **E2E tests**: Playwright (Chromium only), files in `e2e/`, Shadow DOM helpers in `e2e/helpers.ts`
- **Visual regression**: baselines in `e2e/visual.spec.ts-snapshots/` — tracked in git
- E2E requires a build first — the Playwright webServer serves `vanilla-demo` via `vite preview`
- Ad-hoc `e2e-*.png` screenshots at repo root are gitignored
- Mock API calls with `vi.fn()` / `vi.spyOn()` in unit tests; E2E tests hit a real or mocked server

## Code Style

- Linter: **oxlint** (no eslint/prettier)
- Strict TypeScript, target ES2020
- No `console.*` in production code (terser strips them; oxlint warns)
- Prefer explicit types at module boundaries; infer types for local variables
- Named exports only (no default exports)

## Related Projects

When working on this SDK, you may need to reference sibling projects for API contracts, types, and integration context. Use the Read/Grep/Glob tools to consult them as needed.

### TokenFlight Backend — `../tokenflight`

The main TokenFlight application. Provides context for:
- Business logic and product behavior that the embed SDK implements
- Shared concepts (token identifiers, swap flows, wallet interactions)

### Hyperstream API — `../arcadia-monorepo/hyperstream-api`

The cross-chain DeFi aggregation API backend that this SDK calls. Built with Hono on Cloudflare Workers + Prisma (D1). Key reference points:

- **API endpoints consumed by this SDK**:
  - `POST /v1/quotes` — get cross-chain swap quotes (supports `?mode=stream` for streaming)
  - `POST /v1/deposit/build` — build wallet action plan from a selected quote/route
  - `PUT /v1/deposit/submit` — submit deposit tx hash, create order
  - `GET /v1/orders/:address` — track order status (paginated)
  - `GET /v1/tokens` / `GET /v1/tokens/search` — token search and metadata
  - `GET /v1/chains` — supported chains
  - `GET /v1/chains/:chainId/icon` — chain icon image
  - `GET /v1/config/arcadia` — runtime config (contracts, hub)
- **Quote → Build → Submit → Track** flow: the SDK implements the client side of this lifecycle
- **Route/filler types**: Across, DeBridge, Glacis, Hyperstream (native) — each route has `depositMethods` (CONTRACT_CALL, PERMIT2) and `exactOutMethod` (native, adaptive)
- **Error responses**: `{ message, name, details }` envelope; key exception names: `ValidationException`, `CannotFillException`, `QuoteNotFoundException`, `NotSupportedTokenException`, `NotSupportedChainException`
- **Types & schemas**: `src/schemas/` (Zod), `src/types/` — reference these for API request/response shapes
- **Address conventions**: native tokens can be `0x0000...0000`, `0xeeee...eeee` (OKX), or Solana `1111...1111`; use `isSameToken()` for comparison
