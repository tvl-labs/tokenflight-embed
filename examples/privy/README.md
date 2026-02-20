# TokenFlight Privy Example

## Run locally

```bash
pnpm install
pnpm --filter @tokenflight/swap build
pnpm --filter @tokenflight/adapter-privy build
pnpm --filter @tokenflight/example-privy dev
```

## Environment

Create `.env` in this folder:

```bash
VITE_PRIVY_APP_ID=your-privy-app-id
```
