# Guide for agents

## Design

All visual changes must follow `docs/DESIGN.md`.

## Writing

- Docs and comments must strictly not repeat information that is already expressed in code.
- Run the rewrite skill (`/rewrite`) on every doc and comment you write.

## Scope

- Keep the codebase small and lightweight.
- Front matter must contain only the dates, tags, and `unlisted`. Write epistemic status, summaries, and caveats into the note's text so that these carry over into external feeds.
- Opening paragraphs must be able to stand alone. These are used as the note's summary in popovers, the homepage, search, and the feed.
- Never change a published URL.
- Builds must never fetch. Cache fetched data in `src/data/`.
- If you do something by hand three times, automate it.

## Testing

- Show every new feature on the lorem ipsum page in the vault.
- In the Lorem Ipsum page, each paragraph must start with a sentence about what that paragraph is testing.
- Test every feature at phone and wide widths, with and without JS.
- Stop `astro dev` before `npm run check`, since Playwright reuses that server.

## Cleanup

- Astro caches rendered notes. Delete `node_modules/.astro` after you change a plugin in `src/lib/`.
- `rehype-dead-links` must run last, so sources are keyed by their original URL.
- When the Shiki theme changes, trim it again into `src/styles/shiki/`.
