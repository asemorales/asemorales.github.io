# asemorales.com

Notes on logic, complexity, and computability. Built with [Astro](https://astro.build/) and Tailwind CSS, and deployed to GitHub Pages.

The 2025 site is archived at [asemorales.com/2025](https://asemorales.com/2025/) ([source](https://github.com/asemorales/2025)).

## Setup

Needs Node 22.12 or later.

```sh
npm install
npx playwright install chromium firefox webkit
```

## Writing

Notes are written in Obsidian. Everything in the vault's `published/` folder is published, and nothing else leaves the vault.

```sh
VAULT=~/code/obsidian-vault npm run sync
```

This rewrites `src/content/` from the vault, so edit notes in the vault, not here. Each note needs front matter with `date` (first published) and `tags`, and optionally `unlisted: true`. The title comes from the file name and the URL from its slug, so `published/Lorem Ipsum.md` becomes `/lorem-ipsum/`. Review the diff, commit, and push.

## Scripts

| Command              | Does                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| `npm run dev`        | Local server with live reload                                            |
| `npm run build`      | Static build into `dist/`                                                |
| `npm run sync`       | Copy the vault's `published/` folder into `src/content/`                 |
| `npm run check`      | Every linter and test, as in CI                                          |
| `npm run lint`       | Prettier, ESLint, markdownlint, Vale, and `astro check`                  |
| `npm test`           | Unit tests (Vitest)                                                      |
| `npm run test:e2e`   | Browser tests on the built site, wide and phone, with and without JS     |
| `npm run lighthouse` | Lighthouse CI on the built site                                          |
| `npm run fonts`      | Re-subset the fonts from upstream into `public/fonts/` (needs fonttools) |

lefthook runs the fast linters on staged files before each commit. CI runs `npm run check`, link checking, and Lighthouse on every push, and deploys `main` once everything passes.
