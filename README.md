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

Notes are written in Obsidian. Set the vault path once in `.env`:

```sh
echo 'VAULT=~/code/obsidian-vault' > .env
```

Then publish with:

```sh
npm run sync
```

This publishes all notes in the vault's `published/` folder. Wikilinks and slugs are based on the filenames of notes. Each note requires front matter with `title`, `date` (first published), and `tags`. Optionally, add `unlisted: true` to unlist notes.

To write a custom annotation for an external link, add a note to `published/annotations/` with `url` and `title` fields in the front matter. The link's popover uses the title as its heading and the note's text as its body. The `url` must match the note's link exactly. Sync warns about annotations that no note links to, and about PDF links with no annotation, because PDFs have no fetched card.

To change the homepage introduction, edit `published/paratext/introduction.md`. This file needs no front matter, and `npm run sync` does not publish it as a note.

To add a figure, use a `> [!figure]` or `> [!wide-figure]` callout. Put the image on the next line and the optional caption on the line after it.

To cite a source, start the footnote's ID with `cite-`, as in `[^cite-turing]: [Turing 1936](https://doi.org/...), §8.` The footnote must be one external link, optionally followed by text such as a page number. The text can use italics, bold, code, and strikethrough. Anything else fails the build. Citations appear under References, and all other footnotes become sidenotes.

To define a term in any note or footnote, use a `> [!definition] word (type)` callout. The title is optional. To add optional sections, put `### Examples` or `### Etymology` headings inside the callout. To add an attributed quote, nest a `> > [!quote] Attribution` callout inside it.

To add a term to the glossary, add a `## word (type)` heading to `published/paratext/glossary.md`. Write the definition below the heading in a `> [!definition]` callout without a title. To reference a term from any note, link to its heading with `[[glossary#word (type)]]` or `[[glossary#word (type)|other text]]`. The link opens a popover with the definition, and Obsidian autocompletes the heading.

## Scripts

| Command              | Does                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev`        | Local server with live reload                                                                  |
| `npm run build`      | Static build into `dist/`                                                                      |
| `npm run sync`       | Copy the vault's `published/` folder into `src/content/`, then fetch cards for new links       |
| `npm run check`      | Run linters and tests                                                                          |
| `npm run lint`       | Prettier, ESLint, markdownlint, Vale, and `astro check`                                        |
| `npm test`           | Unit tests (Vitest)                                                                            |
| `npm run test:e2e`   | Browser tests on the built site, wide and phone, with and without JS                           |
| `npm run lighthouse` | Lighthouse CI                                                                                  |
| `npm run cards`      | Fetch popover cards for new external links into `src/data/cards.json` (`-- --refresh` for all) |
| `npm run archive`    | Submit new external links to the Wayback Machine (`--dry-run` to list)                         |
| `npm run fonts`      | Re-subset the fonts from upstream into `public/fonts/` (needs fonttools)                       |
| `npm run typos`      | Regenerate the Vale typo rules from Wikipedia (needs Python)                                   |
