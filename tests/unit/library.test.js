import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addToLibrary, describe as summarize, parseExport, parseReader } from "../../scripts/books.js";
import { sync, SyncError } from "../../scripts/sync.js";
import { bookCards, parseLibrary, shelve, suggest, typeOf } from "../../src/lib/library.js";

const URL = "https://www.goodreads.com/book/show";
const HEAD = "| Title | Author | Type | Tags |\n| --- | --- | --- | --- |";
const LIBRARY = `## Currently reading

${HEAD}
| [Open Book](${URL}/1) | Ann Author | Book | #Logic #logic |

## To read

${HEAD}
| [Skipped [Vol. 2]](${URL}/2.Skipped) | Bo Writer | book | #skip #owned #history after [C# Basics](${URL}/3) and [Open Book](${URL}/1) |

## Read

${HEAD}
| [Done](${URL}/3) | Cy Scribe | Book | #logic |
| [Undated](${URL}/4) | Di Penn | Book | |
| [A \\| Paper](https://example.org/wiki/Proof_%28logic%29) | | Research article | #logic |
`;
const PAPER = "https://example.org/wiki/Proof_%28logic%29";

describe("parseLibrary", () => {
  it("reads the status from the heading, and the tags, marks, and prerequisites from the row", () => {
    expect(parseLibrary(LIBRARY)).toEqual({
      problems: [],
      entries: {
        [`${URL}/1`]: { title: "Open Book", status: "reading", type: "book", tags: ["logic"] },
        [`${URL}/2`]: {
          title: "Skipped [Vol. 2]",
          status: "to-read",
          type: "book",
          tags: ["history"],
          skip: true,
          owned: true,
          after: [`${URL}/3`, `${URL}/1`],
        },
        [`${URL}/3`]: { title: "Done", status: "read", type: "book", tags: ["logic"] },
        [`${URL}/4`]: { title: "Undated", status: "read", type: "book", tags: [] },
        [PAPER]: { title: "A | Paper", status: "read", type: "article", tags: ["logic"] },
      },
    });
  });

  it("reports unknown headings, rows before a heading, rows without a linked title, and unknown types", () => {
    const { problems } = parseLibrary(`| [Early](${URL}/1) | |\n## Abandoned\n## Read\n| a stray note | |\n| [Odd](${URL}/5) | A | Zine | |\n`);
    expect(problems.map((p) => p.split(":")[0])).toEqual(["line 1", "line 2", "line 4", "line 5"]);
  });
});

describe("addToLibrary", () => {
  const book = (id, shelf, extra = {}) => ({ url: `${URL}/${id}`, title: `T${id}`, author: "A", shelf, ...extra });

  it("adds only unlisted items, each to the table of its shelf", () => {
    const out = addToLibrary(LIBRARY, [book("1", "read"), book("7", "reading", { title: "T|7" }), book("8", "read", { read: "2026-05-01" })]);
    expect(out).toBe(
      LIBRARY.replace("#logic |\n\n## To read", `#logic |\n| [T\\|7](${URL}/7) | A | Book |  |\n\n## To read`) + `| [T8](${URL}/8) | A | Book |  |\n`,
    );
  });

  it("guesses the type of a new item from its link", () => {
    expect([`${URL}/1`, "https://arxiv.org/abs/1", "https://cel.hal.science/x", "https://example.org/a"].map(typeOf)).toEqual([
      "book",
      "article",
      "article",
      "website",
    ]);
  });

  it("starts an empty file with one heading and table per shelf in use", () => {
    expect(addToLibrary("", [book("1", "read"), book("2", "reading")])).toBe(
      `## Currently reading\n\n${HEAD}\n| [T2](${URL}/2) | A | Book |  |\n\n## Read\n\n${HEAD}\n| [T1](${URL}/1) | A | Book |  |\n`,
    );
  });
});

describe("parseExport", () => {
  it("reads a Goodreads library export, and leaves out books on other shelves", () => {
    const header = "Book Id,Title,Author,ISBN,ISBN13,Date Read,Date Added,Bookshelves,Exclusive Shelf,My Review,Owned Copies";
    const rows = [
      '42,"Proof, ""Revised""  (Series, #1)",Ernest Nagel,"=""0814758371""","=""9780814758373""",2024/03/02,2024/03/01,"logic, favorites",read,"Two\nlines, one comma",1',
      '43,Coverless,Nobody,"=""""","=""""",,2024/03/01,"to-read, logic",to-read,,0',
      "44,Dropped,Nobody,,,,2024/03/01,did-not-finish,did-not-finish,,0",
    ];
    expect(parseExport([header, ...rows].join("\r\n") + "\r\n")).toEqual([
      {
        url: `${URL}/42`,
        cover: "42",
        title: 'Proof, "Revised" (Series, #1)',
        author: "Ernest Nagel",
        isbn: "9780814758373",
        shelf: "read",
        added: "2024-03-01",
        read: "2024-03-02",
      },
      {
        url: `${URL}/43`,
        cover: "43",
        title: "Coverless",
        author: "Nobody",
        isbn: "",
        shelf: "to-read",
        added: "2024-03-01",
        read: null,
      },
    ]);
  });

  it("cuts an Open Library description down to plain text", () => {
    expect(summarize({ value: "A **bold** [claim](https://example.com).\r\n\r\n----------\r\nAlso contained in: X" })).toBe("A bold claim.");
    expect(summarize("Plain. ([source][1])")).toBe("Plain.");
    expect(summarize(undefined)).toBe("");
  });
});

describe("parseReader", () => {
  it("turns Reader documents into library items without their tags", () => {
    const doc = (extra) => ({
      url: "https://read.readwise.io/read/abc",
      source_url: "https://example.org/wiki/Proof_(logic)?utm_source=share&r=abc&wprov=sfla1",
      title: " A  Paper ",
      author: "Ann Author",
      summary: "About proofs.",
      location: "later",
      reading_progress: 0,
      tags: { dani: {}, "Number Theory": {} },
      saved_at: "2026-01-02T03:04:05+00:00",
      last_moved_at: "2026-02-03T00:00:00+00:00",
      last_opened_at: "2026-03-04T00:00:00+00:00",
      ...extra,
    });
    const [paper, upload, opened, finished, archived] = parseReader([
      doc(),
      doc({ source_url: "https://readwise.io/reader/document_raw_content/1", author: "https://github.com/someone" }),
      doc({ reading_progress: 0.4 }),
      doc({ reading_progress: 1 }),
      doc({ location: "archive" }),
      doc({ parent_id: "abc" }),
    ]);
    expect(paper).toEqual({
      url: PAPER,
      title: "A Paper",
      author: "Ann Author",
      description: "About proofs.",
      shelf: "to-read",
      added: "2026-01-02",
      read: null,
    });
    expect(upload).toMatchObject({ url: "https://read.readwise.io/read/abc", author: "" });
    expect(opened.shelf).toBe("reading");
    expect(finished).toMatchObject({ shelf: "read", read: "2026-03-04" });
    expect(archived).toMatchObject({ shelf: "read", read: "2026-02-03" });
  });
});

describe("shelve", () => {
  const READER = "https://read.readwise.io/read/abc";
  const books = {
    [`${URL}/1`]: { cover: "1", title: "A", author: "X", description: "<i>d</i>", shelf: "to-read", added: "2026-01-01", read: null },
    [`https://www.example.org/b`]: { title: "B", author: "Y", description: "", shelf: "read", added: "2026-01-01", read: "2026-02-02" },
    [READER]: { title: "C", author: "", description: "", shelf: "read", added: "2026-01-01", read: null },
  };

  const listed = { "https://www.example.org/b": { status: "read", tags: [] }, [READER]: { status: "read", tags: [] } };

  it("takes the status, type, tags, and cover from the vault, and leaves out an unlisted item", () => {
    expect(shelve(books, { [READER]: listed[READER] })).toHaveLength(1);
    const [a, b, c] = shelve(books, {
      [`${URL}/1`]: { status: "read", type: "book", tags: ["mine"], finished: "2026-04-04", cover: "a.png" },
      ...listed,
    });
    expect(a).toMatchObject({
      status: "read",
      type: "book",
      tags: ["mine"],
      finished: "2026-04-04",
      cover: "a.png",
      site: "",
      skip: false,
      owned: false,
      after: [],
    });
    expect(b).toMatchObject({ status: "read", tags: [], finished: "2026-02-02", site: "example.org", private: false });
    expect(c).toMatchObject({ site: "", private: true });
  });

  it("makes a popover card with the author, status, tags, and escaped description, except for a Reader link", () => {
    const cards = bookCards(shelve(books, { [`${URL}/1`]: { status: "to-read", tags: ["logic", "math"] }, ...listed }));
    expect(cards[`${URL}/1`]).toEqual({ title: "A", meta: ["X", "To read"], tags: ["logic", "math"], paragraphs: ["&lt;i&gt;d&lt;/i&gt;"] });
    expect(cards[READER]).toBeUndefined();
  });
});

describe("suggest", () => {
  const book = (id, status, tags, extra = {}) => ({
    url: id,
    title: id,
    author: id,
    status,
    tags,
    skip: false,
    owned: false,
    after: [],
    finished: null,
    added: "2026-01-01",
    ...extra,
  });
  const order = (books) => suggest(books, "2026-06-30").map((s) => s.book.url);
  const part = (books, id, name) =>
    suggest(books, "2026-06-30")
      .find((s) => s.book.url === id)
      .parts.find((p) => p.name === name).score;

  it("ranks only unskipped to-read books, oldest first when scores tie", () => {
    const books = [
      book("new", "to-read", [], { added: "2026-02-01" }),
      book("old", "to-read", []),
      book("skipped", "to-read", [], { skip: true }),
      book("open", "reading", []),
    ];
    expect(order(books)).toEqual(["old", "new"]);
  });

  it("holds a book back until its prerequisites are read, and ranks a prerequisite first", () => {
    const books = [
      book("plain", "to-read", []),
      book("first", "to-read", [], { added: "2026-03-01" }),
      book("second", "to-read", [], { after: ["first", "done"] }),
      book("ready", "to-read", [], { after: ["done"], added: "2026-02-01" }),
      book("done", "read", []),
    ];
    expect(order(books)).toEqual(["first", "plain", "ready"]);
  });

  it("alternates between fiction and non-fiction", () => {
    const books = [
      book("novel", "to-read", ["fiction"]),
      book("essay", "to-read", []),
      book("last", "read", ["fiction"], { finished: "2026-06-01" }),
    ];
    expect(part(books, "novel", "Genre")).toBe(0);
    expect(part(books, "essay", "Genre")).toBe(1);
  });

  it("ranks a physical copy higher as digital reads pass since the last physical one", () => {
    const shelf = [book("digital", "to-read", []), book("paper", "to-read", [], { owned: true })];
    const done = (id, finished, owned) => book(id, "read", [], { finished, owned });
    expect(part(shelf, "paper", "Physical copy")).toBe(1);
    expect(part([...shelf, done("a", "2026-06-01", true)], "paper", "Physical copy")).toBe(0);
    expect(part([...shelf, done("a", "2026-06-01", true)], "digital", "Physical copy")).toBe(1);
    expect(part([...shelf, done("a", "2026-05-01", true), done("b", "2026-06-01", false)], "paper", "Physical copy")).toBe(1 / 3);
    expect(part([...shelf, book("open", "reading", [], { owned: true })], "paper", "Physical copy")).toBe(0);
  });

  it("weighs each part more than the next", () => {
    const books = [
      book("open", "reading", ["logic", "fiction"]),
      book("last", "read", [], { finished: "2026-06-01" }),
      book("other-genre", "to-read", ["logic", "fiction"]),
      book("no-overlap", "to-read", []),
    ];
    expect(part(books, "other-genre", "Genre")).toBe(1);
    expect(part(books, "no-overlap", "Genre")).toBe(0);
    expect(order(books)).toEqual(["no-overlap", "other-genre"]);
  });

  it("spaces a tag by an interval that doubles with each finished book", () => {
    const books = [
      book("once", "read", ["logic"], { finished: "2026-06-15" }),
      book("twice-1", "read", ["math"], { finished: "2026-01-01" }),
      book("twice-2", "read", ["math"], { finished: "2026-05-31" }),
      book("logic", "to-read", ["logic"]),
      book("math", "to-read", ["math"]),
      book("fresh", "to-read", ["art"]),
    ];
    expect(part(books, "logic", "Spacing")).toBe(15 / 30);
    expect(part(books, "math", "Spacing")).toBe(30 / 60);
    expect(part(books, "fresh", "Spacing")).toBe(0.5);
  });

  it("interleaves by ranking the tags of recently finished books lower, the latest lowest", () => {
    const books = [
      book("last", "read", ["logic"], { finished: "2026-06-01" }),
      book("before", "read", ["math"], { finished: "2026-05-01" }),
      book("logic", "to-read", ["logic"]),
      book("math", "to-read", ["math"]),
      book("art", "to-read", ["art"]),
    ];
    expect(part(books, "art", "Interleaving")).toBe(1);
    expect(part(books, "math", "Interleaving")).toBeGreaterThan(part(books, "logic", "Interleaving"));
  });

  it("avoids interference with a book being read that shares a tag or an author", () => {
    const books = [
      book("open", "reading", ["logic", "math"], { author: "same" }),
      book("overlap", "to-read", ["logic"]),
      book("author", "to-read", ["art"], { author: "same" }),
      book("clear", "to-read", ["art"]),
    ];
    expect(part(books, "overlap", "Non-interference")).toBe(0.5);
    expect(part(books, "author", "Non-interference")).toBe(0);
    expect(order(books)).toEqual(["clear", "overlap", "author"]);
  });
});

describe("sync", () => {
  it("writes the library, dates a newly finished book, and reports it", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sync-library-"));
    const file = path.join(dir, "published/paratext/library.md");
    await fs.mkdir(path.dirname(file), { recursive: true });
    const run = () => sync({ vault: dir, out: path.join(dir, "out"), data: dir, covers: path.join(dir, "covers") });
    const library = async () => JSON.parse(await fs.readFile(path.join(dir, "library.json"), "utf8"));

    await fs.writeFile(file, `About these books.\n\n${LIBRARY}`);
    await fs.mkdir(path.join(path.dirname(file), "covers"));
    await fs.writeFile(path.join(path.dirname(file), "covers/Skipped Vol.png"), "");
    expect((await run()).finished).toEqual([]);
    await fs.access(path.join(dir, "covers/Skipped Vol.png"));
    expect(await fs.readFile(path.join(dir, "out/library.md"), "utf8")).toBe("About these books.\n");
    expect(await library()).toEqual({
      [`${URL}/1`]: { status: "reading", type: "book", tags: ["logic"] },
      [`${URL}/2`]: {
        status: "to-read",
        type: "book",
        tags: ["history"],
        skip: true,
        owned: true,
        after: [`${URL}/3`, `${URL}/1`],
        cover: "Skipped Vol.png",
      },
      [`${URL}/3`]: { status: "read", type: "book", tags: ["logic"] },
      [`${URL}/4`]: { status: "read", type: "book", tags: [] },
      [PAPER]: { status: "read", type: "article", tags: ["logic"] },
    });

    await fs.writeFile(file, LIBRARY.replace("## To read", "## Read"));
    const today = new Date().toISOString().slice(0, 10);
    expect((await run()).finished).toEqual([{ title: "Skipped [Vol. 2]", year: today.slice(0, 4), count: 1 }]);
    expect((await library())[`${URL}/2`].finished).toBe(today);
    expect((await run()).finished).toEqual([]);
    expect((await library())[`${URL}/2`].finished).toBe(today);

    await fs.writeFile(path.join(path.dirname(file), "covers/nothing.jpg"), "");
    await expect(run()).rejects.toThrow(/nothing\.jpg/);
    await fs.writeFile(file, "## Shelved\n");
    await expect(run()).rejects.toThrow(SyncError);
    await fs.rm(dir, { recursive: true, force: true });
  });
});
