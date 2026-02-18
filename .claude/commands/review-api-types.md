Review and sync API types with the Hyperstream API backend.

Steps:
1. Read `packages/swap/src/types/api.ts` for current SDK type definitions
2. Read `packages/swap/src/core/khalani-client.ts` for API call sites and response usage
3. If the Hyperstream API source is available at `../arcadia-monorepo/hyperstream-api`:
   - Check `src/schemas/` for Zod schemas defining API responses
   - Check `src/types/` for TypeScript type definitions
   - Compare with SDK types and flag any mismatches
4. If the API source is not available, review the SDK types for:
   - Missing optional fields that might be in the API response
   - Overly loose types (e.g. `[key: string]: unknown`) that could be tightened
   - Inconsistencies between type definitions and actual usage in components
5. Suggest type improvements with specific code changes
6. Run `pnpm check-types` to verify any changes compile correctly
