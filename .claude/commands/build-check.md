Run a full CI-like verification: build all packages, type-check, lint, and run unit tests.

Steps:
1. Run `npx turbo run build --force` to build all packages from scratch
2. Run `pnpm check-types` to verify TypeScript types
3. Run `pnpm lint` to check for lint errors
4. Run `pnpm test` to run all unit tests
5. Report a summary of results — note any failures
