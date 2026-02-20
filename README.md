# TokenFlight Swap SDK

Embeddable Web Components for cross-chain token swaps. Two components: `<tokenflight-swap>` (exact input amount) and `<tokenflight-receive>` (fixed output amount). Built with Solid.js + solid-element, compiled to Web Components with Shadow DOM.

## Quick Start

```html
<script type="module">
  import { registerElements } from '@tokenflight/swap';
  registerElements();
</script>

<tokenflight-swap
  from-token="eip155:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  to-token="eip155:8453:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  theme="dark"
/>
```

### Imperative API

```ts
import { TokenFlightSwap } from '@tokenflight/swap';

const widget = new TokenFlightSwap({
  container: '#swap-widget',
  config: {
    fromToken: 'eip155:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    toToken: 'eip155:8453:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    theme: 'dark',
  },
  walletAdapter,
});

widget.initialize();
```

## Monorepo Structure

```
packages/swap/         — core SDK (@tokenflight/swap), Solid.js + Vite
packages/adapter-*/    — wallet adapter packages (privy, appkit, thirdweb, wagmi, ethers)
apps/docs/             — Astro Starlight documentation site
e2e/                   — Playwright E2E tests
packages/assets/       — shared assets (logos)
```

**Package manager**: pnpm (v9) · **Build orchestration**: Turborepo

## Development

```sh
pnpm install                         # Install dependencies
pnpm dev                             # Dev servers for all packages (turbo)
pnpm build                           # Build all packages (turbo)
npx turbo run build --force          # Force rebuild
pnpm test                            # Unit tests (Vitest)
pnpm lint                            # Lint (oxlint)
pnpm check-types                     # TypeScript type checking
pnpm e2e                             # Playwright E2E tests (build first!)
pnpm e2e:update                      # Update visual regression snapshots
```

## Web Components

### `<tokenflight-swap>`

Exact input swap widget. User specifies the amount to send.

| Attribute         | Type    | Description                          |
| ----------------- | ------- | ------------------------------------ |
| `api-endpoint`    | string  | Hyperstream API endpoint             |
| `from-token`      | string  | Source token (CAIP-10 or JSON)       |
| `to-token`        | string  | Destination token (CAIP-10 or JSON)  |
| `theme`           | string  | `"light"` / `"dark"` / `"auto"`     |
| `locale`          | string  | Locale code (e.g. `"en-US"`)        |
| `title-text`      | string  | Custom title text                    |
| `title-image`     | string  | Custom title image URL               |
| `hide-title`      | boolean | Hide the header title                |
| `hide-powered-by` | boolean | Hide "Powered by Khalani" footer     |
| `no-background`   | boolean | Remove container background          |
| `no-border`       | boolean | Remove container border and shadow   |
| `csp-nonce`       | string  | CSP nonce for injected styles        |

### `<tokenflight-receive>`

Fixed output widget. User specifies the amount to receive.

| Attribute         | Type    | Description                          |
| ----------------- | ------- | ------------------------------------ |
| `api-endpoint`    | string  | Hyperstream API endpoint             |
| `target`          | string  | Target token (CAIP-10 or JSON)       |
| `amount`          | string  | Amount to receive                    |
| `from-token`      | string  | Optional source token                |
| `theme`           | string  | `"light"` / `"dark"` / `"auto"`     |
| `locale`          | string  | Locale code                          |
| `icon`            | string  | Target token icon URL                |
| `title-text`      | string  | Custom title text                    |
| `title-image`     | string  | Custom title image URL               |
| `hide-title`      | boolean | Hide the header title                |
| `hide-powered-by` | boolean | Hide "Powered by Khalani" footer     |
| `no-background`   | boolean | Remove container background          |
| `no-border`       | boolean | Remove container border and shadow   |
| `csp-nonce`       | string  | CSP nonce for injected styles        |

## Token Identifiers

Tokens can be specified in multiple formats:

- **CAIP-10**: `"eip155:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"`
- **JSON string**: `'{"chainId":1,"address":"0xA0b8..."}'`
- **Object** (imperative API): `{ chainId: 1, address: "0xA0b8..." }`

## Wallet Adapters

Connect wallets via adapter packages that implement the `IWalletAdapter` interface:

```ts
import { TokenFlightSwap } from '@tokenflight/swap';
import { WagmiWalletAdapter } from '@tokenflight/adapter-wagmi';
import { createConfig, http } from '@wagmi/core';
import { injected } from 'wagmi/connectors';
import { mainnet, base } from '@wagmi/core/chains';

const wagmiConfig = createConfig({
  chains: [mainnet, base],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});

const walletAdapter = new WagmiWalletAdapter(wagmiConfig);

const widget = new TokenFlightSwap({
  container: '#swap',
  config: { theme: 'dark' },
  walletAdapter,
});
```

Available adapters: `@tokenflight/adapter-privy`, `@tokenflight/adapter-appkit`, `@tokenflight/adapter-thirdweb`, `@tokenflight/adapter-wagmi`, `@tokenflight/adapter-ethers`

## Internationalization

Supported locales: `en-US`, `zh-CN`, `zh-TW`, `ja-JP`, `ko-KR`

```html
<tokenflight-swap locale="zh-CN" />
```

## Testing

- **Unit tests**: Vitest + jsdom — `packages/swap/src/__tests__/`
- **E2E tests**: Playwright (Chromium) — `e2e/`
- **Visual regression**: baselines in `e2e/visual.spec.ts-snapshots/`

## License

Proprietary — TokenFlight / TVL Labs
