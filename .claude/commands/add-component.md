Scaffold a new Solid.js component in the swap package.

Ask the user for the component name if not provided as $ARGUMENTS.

Steps:
1. Create `packages/swap/src/components/{ComponentName}.tsx`
2. Follow existing conventions:
   - Import from "solid-js" (createSignal, Show, For, etc. as needed)
   - Export a named function component with a Props interface
   - Use `on:keydown` / `on:click` (native colon syntax) for event listeners inside Shadow DOM — **never** use `onKeyDown`/`onClick` delegation
   - All CSS class names must be prefixed with `tf-` (e.g. `.tf-{component-name}`)
   - Do NOT add `/** @jsxImportSource solid-js */` pragma
3. Add corresponding CSS rules in `packages/swap/src/styles/base.ts` with `tf-` prefix
4. Export the component from the relevant barrel file if one exists
5. Show the user the created files for review
