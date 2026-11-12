<div align="center">
    <img src="public/favicon.svg" alt="Site logo" width="140">
    <p>Personal site and writings on logic, complexity, and cognition</p>
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

This publishes all notes in the vault's `published/` folder. Wikilinks and slugs are based on the filenames of notes. Each note requires front matter with `title`, `date` (first published), `last_updated`, and `tags`. Optionally, add `unlisted: true` to unlist notes.

### To write a custom annotation for an external link

Add a note to `published/annotations/` with `url` and `title` fields in the front matter. The link's popover uses the title as its heading and the note's text as its body. The `url` must match the note's link exactly. Sync warns about annotations that no note links to, and about PDF links with no annotation, because PDFs have no fetched card.

### To change the homepage introduction

Edit `published/paratext/introduction.md`. This file needs no front matter, and `npm run sync` does not publish it as a note.

### To add a figure

Use a `> [!figure]` or `> [!wide-figure]` callout. Put the image on the next line and the optional caption on the line after it.

### To cite a source

Start the footnote's ID with `cite-`, as in `[^cite-turing]: [Turing 1936](https://doi.org/...), §8.` The footnote must be one external link, optionally followed by text such as a page number. The text can use italics, bold, code, and strikethrough. Anything else fails the build. Citations appear under References, and all other footnotes become sidenotes.

### To define a term in any note or footnote

Use a `> [!definition] word (type)` callout. The title is optional. To add optional sections, put `### Examples` or `### Etymology` headings inside the callout. To add an attributed quote, nest a `> > [!quote] Attribution` callout inside it.

### To add a term to the glossary

Add a `## word (type)` heading to `published/paratext/glossary.md`. Write the definition below the heading in a `> [!definition]` callout without a title. To reference a term from any note, link to its heading with `[[glossary#word (type)]]` or `[[glossary#word (type)|other text]]`. The link opens a popover with the definition, and Obsidian autocompletes the heading.

## Library

The [library page](https://asemorales.com/library/) shelves books from Goodreads, and papers and articles from Readwise Reader. `npm run sync` pulls both before it publishes the vault.

Goodreads has no feed for shelves, so the books come from its export file:

1. Open [goodreads.com/review/import](https://www.goodreads.com/review/import) and select "Export Library".
2. Save the file as `goodreads_library_export.csv` in `~/Downloads` or in the root of the vault. Sync reads the vault's copy first.

Sync looks up each new book's cover and description on Open Library, and asks again on every run about a book that still lacks either one. Books on an exclusive shelf other than the three status shelves are left out.

For Readwise, add an [access token](https://readwise.io/access_token) to `.env` as `READWISE_TOKEN`. Sync pulls only the Reader documents tagged `dani`. An archived or fully read document counts as read, and a partly read document counts as being read. A document without a public source shows on the page without a link.

Sync caches each item in `src/data/books.json` and each cover in `src/assets/covers/`. It also adds each new item to `published/paratext/library.md` in the vault, as a row in the table under the heading of its shelf. Sync takes no tags from Goodreads or Readwise. The page shows only the items that `library.md` lists, and sync never adds back a row that you delete.

The text above the first heading of `library.md` is the page's introduction. Each heading holds one table with the columns Title, Author, Type, and Tags. The type must be `Book`, `Research article`, or `Website`. Sync guesses the type of each new item from its link. After an item is listed, `library.md` decides its status, type, and tags. Edit it in Obsidian, then run `npm run sync`. The finish date of an item is the day sync first sees its row under `## Read`. An item that sync adds as read takes its date from Goodreads or Readwise.

| To                    | Do                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Change a status       | Move the item's row into the table under `## Currently reading`, `## To read`, or `## Read`                                              |
| Change a type         | Edit the Type cell                                                                                                                       |
| Change tags           | Edit the `#tags` in the Tags cell                                                                                                        |
| Skip a suggested item | Add `#skip` to the Tags cell, and remove it to bring the item back                                                                       |
| Mark a physical copy  | Add `#owned` to the Tags cell                                                                                                            |
| Mark fiction          | Add `#fiction` to the Tags cell. An item without it counts as non-fiction                                                                |
| Remove an item        | Delete its row                                                                                                                           |
| Set a prerequisite    | Write `after` and a link to the earlier item in the Tags cell, as in `after [Title](https://www.goodreads.com/book/show/123)`            |
| Use your own cover    | Save a PNG, JPEG, or WebP image in `published/paratext/covers/`, and name the file after the start of the title, as in `the-martian.jpg` |

## Scripts

| Command              | Does                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Local server with live reload                                                                              |
| `npm run build`      | Static build into `dist/`                                                                                  |
| `npm run sync`       | Pull the library, copy the vault's `published/` folder into `src/content/`, then fetch cards for new links |
| `npm run check`      | Run linters and tests                                                                                      |
| `npm run lint`       | Prettier, ESLint, markdownlint, Vale, and `astro check`                                                    |
| `npm test`           | Unit tests (Vitest)                                                                                        |
| `npm run test:e2e`   | Browser tests on the built site, wide and phone, with and without JS                                       |
| `npm run lighthouse` | Lighthouse CI                                                                                              |
| `npm run cards`      | Fetch popover cards for new external links into `src/data/cards.json` (`-- --refresh` for all)             |
| `npm run archive`    | Submit new external links to the Wayback Machine (`--dry-run` to list)                                     |
| `npm run fonts`      | Re-subset the fonts from upstream into `public/fonts/` (needs fonttools)                                   |
| `npm run typos`      | Regenerate the Vale typo rules from Wikipedia (needs Python)                                               |
