# asemorales.com

Notes on logic, complexity, and cognition. Built with [Astro](https://astro.build/) and Tailwind CSS, and deployed to GitHub Pages.

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

## Substack

Substack has no API for posts, so mirror each note by hand once it is live on asemorales.com. Work from the note in Obsidian's reading view, never from the site's HTML.

1. Title: the note's title. Subtitle: none.
2. First line, in italics: "Originally published at asemorales.com/<slug>/", linked. Substack can't set a canonical URL, so this line stands in for it.
3. Paste the body from reading view. Headings, emphasis, lists, quotes, and links come across.
4. Rewrite every wikilink as a link to its note on asemorales.com.
5. Turn each sidenote and citation into a Substack footnote, in order.
6. Inline math has no LaTeX in Substack. Write it in Unicode, or as a display equation if it can't be.
7. Display math goes in a LaTeX block, pasted from the TeX. Substack's renderer has no `bussproofs`, so a proof tree goes in as a PNG screenshot from the site, with its TeX as the alt text. Equation numbers and `\eqref` don't carry over, so refer to equations in words.
8. Code goes in code blocks. A status notice becomes an ordinary quote at the top.
9. Tags: the note's first tag as the section, if one matches.
10. Preview on a phone, then publish and send.

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
| `npm run cards`      | Fetch popover cards for new external links into `src/data/cards.json`    |
| `npm run archive`    | Submit new external links to the Wayback Machine (`--dry-run` to list)   |
| `npm run fonts`      | Re-subset the fonts from upstream into `public/fonts/` (needs fonttools) |

lefthook runs the fast linters on staged files before each commit. CI runs `npm run check`, link checking, and Lighthouse on every push, and deploys `main` once everything passes.
