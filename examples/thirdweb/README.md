# TokenFlight Thirdweb Example

## Run locally

```bash
pnpm install
pnpm --filter @tokenflight/swap build
pnpm --filter @tokenflight/adapter-thirdweb build
pnpm --filter @tokenflight/example-thirdweb dev
```

## Environment

Create `.env` in this folder:

```bash
VITE_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
```
