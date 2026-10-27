<div align="center">
    <img src="public/favicon.svg" alt="Site logo" width="70">
    <h1>Ase Morales</h1>
    <p>On logic, complexity, and cognition</p>
    <a href="https://asemorales.com">View site</a>
</div>

## Setup

Your system must have at least Node 22.12. Run the following:

```sh
npm install
npx playwright install chromium firefox webkit
```

## Writing

Notes are written in Obsidian and published with the command:

```sh
VAULT={$OBSIDIAN_VAULT_PATH} npm run sync
```

This publishes all notes in the vault's `published/` folder. Each note requires front matter with `date` (first published) and `tags`. Optionally, add `unlisted: true` to unlist notes.

To write custom annotations for an external link, add a note to `published/annotations/` with a `url` field in the front matter. Text in custom annotations are used in popovers for that link.

## Scripts

| Command              | Does                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev`        | Local server with live reload                                                                  |
| `npm run build`      | Static build into `dist/`                                                                      |
| `npm run sync`       | Copy the vault's `published/` folder into `src/content/`                                       |
| `npm run check`      | Run linters and tests                                                                          |
| `npm run lint`       | Prettier, ESLint, markdownlint, Vale, and `astro check`                                        |
| `npm test`           | Unit tests (Vitest)                                                                            |
| `npm run test:e2e`   | Browser tests on the built site, wide and phone, with and without JS                           |
| `npm run lighthouse` | Lighthouse CI                                                                                  |
| `npm run cards`      | Fetch popover cards for new external links into `src/data/cards.json` (`-- --refresh` for all) |
| `npm run archive`    | Submit new external links to the Wayback Machine (`--dry-run` to list)                         |
| `npm run fonts`      | Re-subset the fonts from upstream into `public/fonts/` (needs fonttools)                       |
