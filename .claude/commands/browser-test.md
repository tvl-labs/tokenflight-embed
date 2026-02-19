Browser tester — visually inspect and interactively test the widget in a real Chrome browser.

The user will describe what to test as $ARGUMENTS. If no arguments given, perform a full smoke test.

## Setup

1. Build the project: `npx turbo run build --force`
2. Start the vanilla-demo preview server: `npx vite preview examples/vanilla-demo --port 4174 &`
3. Wait a moment for the server to start
4. Open the browser using Playwright MCP or Claude-in-Chrome:
   - Navigate to `http://localhost:4174`

## Testing Approach

### Visual Inspection
- Take screenshots of the widget in its default state
- Check both light and dark themes (toggle via the demo page controls)
- Verify layout, spacing, typography, and color consistency
- Check that token icons and chain icons load correctly
- Verify responsive behavior at different viewport widths (375px mobile, 768px tablet, 1024px desktop)

### Interactive Testing
- Click through the token selector modal — verify search, chain filter, scrolling
- Type amounts in the input field — verify formatting, debounce, quote fetching
- Test keyboard navigation (Tab, Enter, Escape) inside Shadow DOM
- Verify hover states, focus rings, transitions, and animations
- Check that error states display correctly (invalid amounts, network errors)

### Accessibility Checks
- Verify focus order is logical
- Check that interactive elements have visible focus indicators
- Verify contrast ratios meet WCAG AA (4.5:1 for text)
- Check that the modal traps focus correctly

### Cross-theme Testing
- Switch between `theme="light"` and `theme="dark"`
- Verify all colors adapt correctly
- Check that custom accent colors work (`accent` attribute)

## Reporting

After testing, provide a structured report:
1. **Screenshots** taken during testing
2. **Issues found** — categorized as visual, functional, or accessibility
3. **Suggestions** for improvements
4. Clean up by stopping the preview server when done
