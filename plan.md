# Plan: reading analytics with Umami events

Umami counts views per page but cannot say how long people read a note or how far they get. This plan adds two custom events through `umami.track()`. Together they give engaged time and scroll depth for each note, with no new dependency and no cookies.

## Goals

1. Average engaged time per page. Count only time while the tab is visible.
2. Scroll depth per page at 25%, 50%, 75%, and 90% of the note's prose.

## Non-goals

- Heatmaps, session replay, or any data tied to a single reader.
- Tracking on pages other than notes.
- A dashboard inside the site. The Umami dashboard and the API are enough.

## Design

### Where the code lives

Add one component, `src/components/Reading.astro`, with a bundled `<script>`. Render it in `src/pages/[slug].astro` next to `<NoteTools />`. The site has no client router, so each note is a full page load and the script runs once per view.

The script calls `window.umami?.track(...)`. In dev, and when an ad blocker stops Umami, the call does nothing.

### Engaged time

- Keep a running total of milliseconds while `document.visibilityState === "visible"`.
- Pause after five minutes without `scroll`, `keydown`, or `pointerdown` events, and resume on the next one. Without this, a tab left open overnight counts as hours of reading. Readers may linger on a passage for minutes without scrolling, so the limit must be generous.
- On every `visibilitychange` to `hidden`, send `umami.track("engaged", { seconds })` with the time since the last send, then reset the total. On phones, `hidden` is the last event the browser fires reliably before closing a tab, so do not rely on `pagehide` or `beforeunload`.
- Skip the send when `seconds` is under 1.

One view can send several `engaged` events if the reader switches tabs and comes back. The sum of `seconds` for a page divided by its views gives average engaged time. Umami records the URL on every event, so no extra property is needed.

Check before building: Umami's tracker must send with `fetch(..., { keepalive: true })` or `sendBeacon`. Otherwise the browser can drop the request while the page closes. If it uses neither, send from our own code to `https://cloud.umami.is/api/send` with `keepalive`, using the payload the tracker sends.

### Scroll depth

- Measure depth against the prose only. The prose starts at the top of `article.note` and ends at the top of `footer.bottom`. Counting backlinks and sources would inflate the depth.
- Depth is `(scrollY + innerHeight - proseTop) / proseHeight`.
- Recompute on `scroll` (passive, at most once per animation frame) and once on load.
- Send `umami.track("scroll", { depth: 25 })` once per view for each threshold the reader passes: 25, 50, 75, 90.
- A note that fits on screen fires every threshold on load. That is correct, since the reader can see the whole note.
- Jumping to a heading anchor fires every threshold up to that point, which is acceptable.

The share of views that reach each threshold is the drop-off curve for the note.

### Event budget

Each view sends at most four `scroll` events and usually one or two `engaged` events. Check this against the Umami Cloud plan's monthly event limit before shipping.

## Reading the data

- Dashboard: Events lists `engaged` and `scroll`. Filter by URL, and break `scroll` down by `depth`.
- The dashboard may not total a numeric property. If so, add `scripts/umami-report.js`, which reads `UMAMI_API_KEY` and prints, for each note, its views, average engaged seconds, and the share of views reaching each depth. It runs by hand and never during a build.

## Testing

- Unit tests in `tests/unit/` for the pure parts: computing depth from the prose bounds, and each threshold firing only once per view.
- E2E in `tests/e2e/note.spec.ts`. Tests run against `astro preview`, a production build that loads the real Umami script. Block `cloud.umami.is` with `page.route` and stub `window.umami.track` with `addInitScript` to record calls.
  - Scroll to the end of a long note and expect depths 25, 50, 75, and 90, each once.
  - Hide the page by emulating `visibilitychange` and expect one `engaged` event with positive `seconds`.
  - With JS off, the note renders as before and nothing errors.
- Run at phone and wide widths, with and without JS, per `AGENTS.md`.
- Add a paragraph to `lorem-ipsum.md` in the vault that opens by saying the page's length tests scroll-depth events, then run `npm run sync`.
- Stop `astro dev` before `npm run check`. Run e2e with `--workers=1`.
