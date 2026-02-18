Check wallet adapter packages for consistency and type compatibility.

Steps:
1. Read the wallet adapter interface at `packages/swap/src/types/wallet.ts`
2. Read each adapter package's main source:
   - `packages/adapter-privy/src/index.ts`
   - `packages/adapter-appkit/src/index.ts`
   - `packages/adapter-thirdweb/src/index.ts`
3. Verify each adapter correctly implements the `IWalletAdapter` interface
4. Check that all adapter `package.json` files have compatible peer dependency versions
5. Run `pnpm check-types` to verify type compatibility across all packages
6. Report any inconsistencies or missing method implementations
