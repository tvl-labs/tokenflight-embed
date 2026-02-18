Build the project and run Playwright E2E tests.

Steps:
1. Run `npx turbo run build --force` (E2E tests require a fresh build)
2. Run `pnpm e2e` to execute all Playwright E2E tests
3. If tests fail, analyze the output and suggest fixes
4. If the user mentions updating snapshots, run `pnpm e2e:update` instead of `pnpm e2e` in step 2

Note: E2E tests run against a Vite preview server for the vanilla-demo example. Playwright config is at the repo root.
