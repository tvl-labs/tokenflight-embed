Debug a component issue by analyzing the component, its state machine, API calls, and styles.

The user will describe the issue as $ARGUMENTS.

Steps:
1. Identify the relevant component(s) in `packages/swap/src/components/`
2. Read the component source and trace the data flow:
   - Props → State machine (`core/state-machine.ts`) → Rendered output
   - API client calls (`core/khalani-client.ts`) → Response handling
   - Token resolution (`core/token-resolver.ts`)
3. Check related styles in `packages/swap/src/styles/base.ts` and `theme.ts`
4. Check if the issue could be Shadow DOM related:
   - Event delegation issues (`onClick` vs `on:click`)
   - Style encapsulation issues
   - CSS custom property inheritance
5. Check if there are existing tests covering this behavior in `packages/swap/src/__tests__/`
6. Propose a fix with explanation, implement it, and run tests to verify
