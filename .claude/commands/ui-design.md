Advanced UI designer — improve visual design, create polished UI components, and refine the widget's look and feel.

The user will describe the design task as $ARGUMENTS.

## Design Principles

This is a **financial widget** embedded in third-party sites. Design must be:
- **Trustworthy**: Clean, professional, no visual clutter
- **Compact**: Fits in a sidebar or modal — every pixel counts
- **Accessible**: WCAG AA compliant, clear contrast, readable at small sizes
- **Themeable**: Works in light/dark mode, respects host site's accent color
- **Consistent**: Follows existing `tf-` class naming and CSS custom property patterns

## Design System Reference

- Theme variables: `packages/swap/src/styles/theme.ts` — all `--tf-*` CSS custom properties
- Component styles: `packages/swap/src/styles/base.ts` — single file, all CSS
- Icons: `packages/swap/src/components/icons.tsx` — SVG icons and token/chain imagery
- i18n: all user-facing text via `t("key")` — add keys to all 5 locale files

## Workflow

1. **Understand**: Read the relevant component source + styles to understand current state
2. **Reference**: Look at best-in-class DeFi widget designs (Uniswap, 1inch, Jupiter, LI.FI) for inspiration
3. **Design**: Propose changes with clear before/after descriptions
4. **Implement**: Make CSS/component changes following conventions:
   - All classes prefixed `tf-`
   - BEM modifiers: `.tf-component--modifier`
   - Theme colors via `var(--tf-*)` custom properties
   - Transitions: use `var(--tf-transition)` for consistency
   - Shadows: use theme shadow variables
   - Border radius: use `var(--tf-radius)` and `var(--tf-radius-lg)`
5. **Verify**: Build and visually inspect in browser (use Playwright or Claude-in-Chrome)
   - Check both light and dark themes
   - Test at mobile (375px) and desktop (400px widget width) sizes
   - Verify no regressions in other components

## Key Areas

- **Typography**: Font sizes, weights, line heights, letter spacing
- **Spacing**: Padding, margins, gaps — consistent 4px/8px grid
- **Color**: Theme-aware, sufficient contrast, meaningful use of accent color
- **Motion**: Subtle transitions and animations for state changes
- **Micro-interactions**: Hover effects, press states, loading skeletons
- **Empty/Error States**: Graceful, informative, actionable
- **Responsive**: Widget works from 320px to 480px width

## Output

- Modified CSS in `styles/base.ts` and/or `styles/theme.ts`
- Component changes in `components/*.tsx` if needed
- Screenshots showing before/after comparisons
- Notes on any theme variable additions for documentation
