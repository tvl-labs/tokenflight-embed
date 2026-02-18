Build the swap package and report bundle sizes. Check against the 30KB gzip target.

Steps:
1. Run `npx turbo run build --force` to ensure a clean build
2. Run `gzip -c packages/swap/dist/tokenflight-swap.js | wc -c` to get ESM gzip size
3. Run `gzip -c packages/swap/dist/tokenflight-swap.umd.cjs | wc -c` to get UMD gzip size
4. Convert bytes to KB and report both sizes
5. Compare against the 30KB gzip target and flag if either exceeds it
