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

## Critical Conventions

### Shadow DOM + Solid.js Events
Solid's `onKeyDown`/`onClick` etc. use event delegation attached to the document root. Events inside Shadow DOM don't bubble past the shadow boundary. **Always use `on:keydown` (lowercase, colon syntax)** for native event listeners inside Shadow DOM components.

### Build
- **Do NOT** add `/** @jsxImportSource solid-js */` pragma — vite-plugin-solid handles JSX transformation. `tsconfig.json` `jsxImportSource` is sufficient.
- `npx turbo run build --force` for forced rebuilds. `pnpm build -- --force` passes `--force` to Vite which doesn't accept it.
- `terser` must be an explicit devDependency in `packages/swap/` (Vite v6+ requires it).
- Bundle size target: **≤ 30 KB gzip** (ESM and UMD outputs). Current: ~30.7 KB ESM, ~25.8 KB UMD.

### CSS
All CSS classes are prefixed with `tf-`: `.tf-footer`, `.tf-pay-token`, `.tf-best-badge`, `.tf-browse-all`, `.tf-pay-token--disabled`, etc.

## Testing

- **Unit tests**: Vitest + jsdom, files in `packages/swap/src/__tests__/`
- **E2E tests**: Playwright (Chromium only), files in `e2e/`, Shadow DOM helpers in `e2e/helpers.ts`
- **Visual regression**: baselines in `e2e/visual.spec.ts-snapshots/` — tracked in git
- E2E requires a build first — the Playwright webServer serves `vanilla-demo` via `vite preview`
- Ad-hoc `e2e-*.png` screenshots at repo root are gitignored

## Code Style

- Linter: **oxlint** (no eslint/prettier)
- Strict TypeScript, target ES2020
- No `console.*` in production code (terser strips them; oxlint warns)

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
  - `GET /v1/config/arcadia` — runtime config (contracts, hub)
- **Quote → Build → Submit → Track** flow: the SDK implements the client side of this lifecycle
- **Route/filler types**: Across, DeBridge, Glacis, Hyperstream (native) — each route has `depositMethods` (CONTRACT_CALL, PERMIT2) and `exactOutMethod` (native, adaptive)
- **Error responses**: `{ message, name, details }` envelope; key exception names: `ValidationException`, `CannotFillException`, `QuoteNotFoundException`, `NotSupportedTokenException`, `NotSupportedChainException`
- **Types & schemas**: `src/schemas/` (Zod), `src/types/` — reference these for API request/response shapes
- **Address conventions**: native tokens can be `0x0000...0000`, `0xeeee...eeee` (OKX), or Solana `1111...1111`; use `isSameToken()` for comparison
