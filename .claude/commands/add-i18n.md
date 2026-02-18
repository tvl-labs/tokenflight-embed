Add or update internationalization (i18n) strings across all supported locales.

The user will describe the new UI text needed as $ARGUMENTS.

Steps:
1. Read the English locale file `packages/swap/src/i18n/en-US.ts` to understand the key structure
2. Read all locale files: `en-US.ts`, `zh-CN.ts`, `zh-TW.ts`, `ja-JP.ts`, `ko-KR.ts`
3. Add the new key(s) to ALL locale files with proper translations:
   - `en-US.ts` — English (primary)
   - `zh-CN.ts` — Simplified Chinese
   - `zh-TW.ts` — Traditional Chinese
   - `ja-JP.ts` — Japanese
   - `ko-KR.ts` — Korean
4. Follow the existing key naming convention (dot-separated, e.g. `swap.balance`, `receive.youReceive`)
5. Verify the i18n index file (`packages/swap/src/i18n/index.ts`) exports all locales correctly
6. Run `pnpm check-types` to verify no type errors
