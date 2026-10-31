# Design system

## Principles

- Content comes first, and each ornament must earn its place.
- Each visual difference must carry a meaning. Do not style an element differently for variety.
- A page must be fully readable without JavaScript.
- Work at build time whenever possible. Speed comes second only to correctness.
- All essential information must be present in the text, so that content is not lost once streamed over the Atom feed to other readers.
- When in doubt, copy Wikipedia.

## Layout

- Set the text in a narrow column offset left, as in Tufte CSS.
- Reserve the right margin for sidenotes and infoboxes. On narrow screens, stack them into the column.

## Type

- Set everything in serif. Use mono only for code and data such as dates and tags.
- Show emphasis in three styles: bold, then italic, then small caps.
- Use old-style proportional figures in prose.
- Use lining tabular figures in tables, code, and anywhere else that numbers must align.
- Self-host and subset fonts, since system fonts vary across platforms.

## Color

- All colors must be stored as variables. Define each color variable for both light and dark mode.
- Switch between light and dark mode through color variables. Never use `filter: invert()`.
- Use palette colors from asemorales/bierstadt.
- Interface elements must use the theme's grayscale colors. Use hue only for meaning. Links and code use hue for this reason.
- Set links in ink, and show their hue only on hover or press, so that pages dense with links still read as prose.
- Text colors must pass WCAG AA (4.5:1) contrast.
- Color must never be the sole indicator of meaning. Pair it with a shape, such as an underline style.
- Check if colors are distinct under color blindness.

## Interaction

- Prefer native elements to scripts, such as `<details>`, the `popover` attribute, and checkbox toggles.
- Elements that open on hover must also open by tap and by keyboard.
- Keep controls visible. Do not hide them in menus.
- When an element is highlighted on hover, the element must still be highlighted after being clicked, and until the next click elsewhere.
- On touch screens, open link previews in a drawer that rises from the bottom.
- Keep popovers small and text-only, and compute their content at build time.

## Print

- Every element must work in print. Expand collapsed content and hide controls that only work onscreen.
