import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  check,
  cleanAuthor,
  cleanTitle,
  describe as summarize,
  imageSize,
  paperId,
  parseArxiv,
  parseCrossref,
  parseReader,
  parseShelf,
  parseSiteName,
  syncLibrary,
} from "../../scripts/books.js";
import { sync, SyncError } from "../../scripts/sync.js";
import { bookCards, parseLibrary, shelve, suggest, typeOf } from "../../src/lib/library.js";

const URL = "https://openlibrary.org/works";
const HEAD = "| Title | Author | Type | Source | Tags |\n| --- | --- | --- | --- | --- |";
const LIBRARY = `## Currently reading

${HEAD}
| [Open Book](${URL}/OL1W) | Ann Author | Book | Open Library | #Logic #logic |

## To read

${HEAD}
| [Skipped [Vol. 2]](${URL}/OL2W/Skipped) | Bo Writer | book | open library | #skip #owned #history after [C# Basics](${URL}/OL3W) and [Open Book](${URL}/OL1W) |

## Read

${HEAD}
| [Done](${URL}/OL3W) | Cy Scribe | Book | Open Library | #logic |
| [Undated](${URL}/OL4W) | Di Penn | Book | Open Library | |
| [A \\| Paper](https://example.org/wiki/Proof_%28logic%29) | | Research article | Readwise | #logic |
`;
const PAPER = "https://example.org/wiki/Proof_%28logic%29";

describe("parseLibrary", () => {
  it("reads the status from the heading, and the tags, marks, and prerequisites from the row", () => {
    expect(parseLibrary(LIBRARY)).toEqual({
      problems: [],
      entries: {
        [`${URL}/OL1W`]: { title: "Open Book", status: "reading", type: "book", tags: ["logic"] },
        [`${URL}/OL2W`]: {
          title: "Skipped [Vol. 2]",
          status: "to-read",
          type: "book",
          tags: ["history"],
          skip: true,
          owned: true,
          after: [`${URL}/OL3W`, `${URL}/OL1W`],
        },
        [`${URL}/OL3W`]: { title: "Done", status: "read", type: "book", tags: ["logic"] },
        [`${URL}/OL4W`]: { title: "Undated", status: "read", type: "book", tags: [] },
        [PAPER]: { title: "A | Paper", status: "read", type: "article", tags: ["logic"] },
      },
    });
  });

  it("reports unknown headings, rows before a heading, rows without a linked title, unknown types, and unknown sources", () => {
    const { problems } = parseLibrary(
      `| [Early](${URL}/OL1W) | |\n## Abandoned\n## Read\n| a stray note | |\n| [Odd](${URL}/OL5W) | A | Zine | Readwise | |\n| [Odd](${URL}/OL6W) | A | Book | Shop | |\n`,
    );
    expect(problems.map((p) => p.split(":")[0])).toEqual(["line 1", "line 2", "line 4", "line 5", "line 6"]);
  });
});

describe("syncLibrary", () => {
  const book = (id, shelf, extra = {}) => ({ url: `${URL}/OL${id}W`, title: `T${id}`, author: "A", source: "Open Library", shelf, ...extra });
  const OPEN = `| [Open Book](${URL}/OL1W) | Ann Author | Book | Open Library | #Logic #logic |\n`;
  const PAPER_ROW = `| [A \\| Paper](${PAPER}) | | Research article | Readwise | #logic |\n`;

  it("adds each new item to the table of its shelf", () => {
    const out = syncLibrary(LIBRARY, [book("7", "reading", { title: "T|7" }), book("8", "read", { read: "2026-05-01" })], []);
    expect(out).toBe(
      LIBRARY.replace("#logic |\n\n## To read", `#logic |\n| [T\\|7](${URL}/OL7W) | A | Book | Open Library |  |\n\n## To read`) +
        `| [T8](${URL}/OL8W) | A | Book | Open Library |  |\n`,
    );
  });

  it("moves a row to the table of its new shelf with its type and tags", () => {
    const out = syncLibrary(LIBRARY, [book("1", "read", { title: "Open Book", author: "Ann Author" })], []);
    expect(out).toBe(LIBRARY.replace(OPEN, "") + OPEN);
  });

  it("rewrites the title and author of a changed row, and leaves an unchanged row as it is", () => {
    const padded = LIBRARY.replace("| [Done]", "|   [Done]");
    const out = syncLibrary(padded, [book("3", "read", { title: "Done", author: "Cy Scribe" }), book("4", "read", { title: "Dated" })], []);
    expect(out).toBe(
      padded.replace(`| [Undated](${URL}/OL4W) | Di Penn | Book | Open Library | |`, `| [Dated](${URL}/OL4W) | A | Book | Open Library |  |`),
    );
  });

  it("removes a row only when its source was fetched and no longer lists the item", () => {
    expect(syncLibrary(LIBRARY, [], ["Readwise"])).toBe(LIBRARY.replace(PAPER_ROW, ""));
  });

  it("guesses the type of a new item from its link", () => {
    expect([`${URL}/OL1W`, "https://arxiv.org/abs/1", "https://cel.hal.science/x", "https://example.org/a"].map(typeOf)).toEqual([
      "book",
      "article",
      "article",
      "website",
    ]);
  });

  it("starts an empty file with one heading and table per shelf in use", () => {
    expect(syncLibrary("", [book("1", "read"), book("2", "reading")], [])).toBe(
      `## Currently reading\n\n${HEAD}\n| [T2](${URL}/OL2W) | A | Book | Open Library |  |\n\n## Read\n\n${HEAD}\n| [T1](${URL}/OL1W) | A | Book | Open Library |  |\n`,
    );
  });
});

describe("parseShelf", () => {
  it("reads a shelf of an Open Library reading log", () => {
    const entry = (extra) => ({
      work: { key: "/works/OL42W", title: " Proof,  Revised ", author_names: ["Ernest Nagel", "James Newman"], cover_id: 7, ...extra },
      logged_edition: "/books/OL1M",
      logged_date: "2024/03/01, 10:00:00",
    });
    expect(parseShelf([entry()], "read")).toEqual([
      {
        url: `${URL}/OL42W`,
        cover: "OL42W",
        title: "Proof, Revised",
        author: "Ernest Nagel",
        shelf: "read",
        added: "2024-03-01",
        read: "2024-03-01",
        lookup: { edition: "/books/OL1M", cover: 7 },
      },
    ]);
    expect(parseShelf([{ ...entry({ author_names: undefined, cover_id: undefined }), logged_edition: null }], "to-read")[0]).toMatchObject({
      author: "",
      read: null,
      lookup: { edition: null, cover: null },
    });
  });

  it("cuts an Open Library description down to plain text", () => {
    expect(summarize({ value: "A **bold** [claim](https://example.com).\r\n\r\n----------\r\nAlso contained in: X" })).toBe("A bold claim.");
    expect(summarize("Plain. ([source][1])")).toBe("Plain.");
    expect(summarize(undefined)).toBe("");
  });
});

describe("check", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const run = async (...responses) => {
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetch = vi.fn();
    for (const res of responses) fetch.mockImplementationOnce(() => (res instanceof Error ? Promise.reject(res) : Promise.resolve(res)));
    vi.stubGlobal("fetch", fetch);
    const up = check("Site", "https://example.org/");
    await vi.runAllTimersAsync();
    return { up: await up, calls: fetch.mock.calls.length };
  };

  it("skips a site that is down after two checks, and asks again once when the first check fails", async () => {
    expect(await run(new Response(null, { status: 503 }), new TypeError("fetch failed"))).toEqual({ up: false, calls: 2 });
    expect(await run(new Response(null, { status: 503 }), new Response(null, { status: 200 }))).toEqual({ up: true, calls: 2 });
  });

  it("skips a site that refuses the request without asking again", async () => {
    expect(await run(new Response(null, { status: 401 }))).toEqual({ up: false, calls: 1 });
  });
});

describe("parseReader", () => {
  it("turns Reader documents into library items without their tags", () => {
    const doc = (extra) => ({
      url: "https://read.readwise.io/read/abc",
      source_url: "https://example.org/wiki/Proof_(logic)?utm_source=share&r=abc&wprov=sfla1",
      title: " A  Paper ",
      author: "Ann Author",
      site_name: "Example <i>(it/its)</i> Journal",
      summary: "About proofs.",
      location: "later",
      reading_progress: 0,
      tags: { dani: {}, "Number Theory": {} },
      saved_at: "2026-01-02T03:04:05+00:00",
      last_moved_at: "2026-02-03T00:00:00+00:00",
      last_opened_at: "2026-03-04T00:00:00+00:00",
      image_url: "https://example.org/cover.png",
      ...extra,
    });
    const [paper, upload, opened, finished, archived] = parseReader([
      doc(),
      doc({
        source_url: "https://readwise.io/reader/document_raw_content/1",
        author: "https://github.com/someone",
        site_name: "readwise-upload-pdf",
        image_url: "f5_confusion6.png",
      }),
      doc({ reading_progress: 0.4 }),
      doc({ reading_progress: 1 }),
      doc({ location: "archive" }),
      doc({ parent_id: "abc" }),
    ]);
    expect(paper).toEqual({
      url: PAPER,
      title: "A Paper",
      author: "Ann Author",
      siteName: "Example Journal",
      description: "About proofs.",
      image: "https://example.org/cover.png",
      shelf: "to-read",
      added: "2026-01-02",
      read: null,
    });
    expect(upload).toMatchObject({ url: "https://read.readwise.io/read/abc", author: "", siteName: "", image: null });
    expect(opened.shelf).toBe("reading");
    expect(finished).toMatchObject({ shelf: "read", read: "2026-03-04" });
    expect(archived).toMatchObject({ shelf: "read", read: "2026-02-03" });
  });

  it("cuts the site's name and the byline from a title, and turns a file name into words", () => {
    const names = ["Big Think", "bigthink"];
    expect(cleanTitle("Minds - Big Think | BigThink", "", names)).toBe("Minds");
    expect(cleanTitle("Minds - by Ann Author", "Ann Author", names)).toBe("Minds");
    expect(cleanTitle("Minds by Ann Author :: SSRN", "Ann Author", ["SSRN"])).toBe("Minds");
    expect(cleanTitle("Terence Tao – Kepler and Newton", "", names)).toBe("Terence Tao – Kepler and Newton");
    expect(cleanTitle("Math-Education_in-2026.pdf", "", names)).toBe("Math Education in 2026");
  });

  it("drops an image too small to be more than a logo, and crops a wide image", () => {
    expect(imageSize({ width: 200, height: 200 })).toBeNull();
    expect(imageSize({ width: 1200, height: 600 })).toEqual({ width: 533, height: 400 });
    expect(imageSize({ width: 300, height: 450 })).toEqual({ width: 267, height: 400 });
  });

  it("joins a list of authors with commas, and drops a link that Reader took for the author", () => {
    expect(cleanAuthor(" Ann Author;Bo Writer ")).toBe("Ann Author, Bo Writer");
    expect(cleanAuthor("projecteuclid.org")).toBe("");
    expect(cleanAuthor("Robin Sloan")).toBe("Robin Sloan");
  });
});

describe("parseSiteName", () => {
  it("reads a site's name from the og:site_name, the application-name, or the title of its home page", () => {
    expect(parseSiteName(`<title>Home</title><meta content="Joe's &amp; Co" property="og:site_name">`)).toBe("Joe's & Co");
    expect(parseSiteName(`<meta name="application-name" content='Wikipedia'><title>Home</title>`)).toBe("Wikipedia");
    expect(parseSiteName(`<title>Gwern.net</title>`)).toBe("");
    expect(parseSiteName(`<title>Fruit of Eden | Adam Rochussen | Substack</title>`)).toBe("Fruit of Eden");
  });
});

describe("paperId", () => {
  it("reads an arXiv ID or a DOI from a link", () => {
    expect(paperId("https://arxiv.org/pdf/2606.31877v1")).toEqual({ arxiv: "2606.31877" });
    expect(paperId("https://arxiv.org/abs/quant-ph/9908043")).toEqual({ arxiv: "quant-ph/9908043" });
    expect(paperId("https://example.org/journals/x/10.1305/ndjfl/1093888009.pdf")).toEqual({ doi: "10.1305/ndjfl/1093888009" });
    expect(paperId("https://example.org/doi/epdf/10.3982/ECTA18580/full")).toEqual({ doi: "10.3982/ECTA18580" });
    expect(paperId("https://example.org/article?id=10.1371/journal.pmed.0020124&x=1")).toEqual({ doi: "10.1371/journal.pmed.0020124" });
    expect(paperId("https://www.nature.com/articles/s41562-017-0273-4")).toEqual({ doi: "10.1038/s41562-017-0273-4" });
    expect(paperId("https://www.jstor.org/stable/2306078")).toEqual({ doi: "10.2307/2306078" });
    expect(paperId("https://papers.ssrn.com/sol3/papers.cfm?abstract_id=71")).toEqual({ doi: "10.2139/ssrn.71" });
    expect(paperId("https://www.nature.com/news")).toBeNull();
  });

  it("reads the title, authors, venue, and year of a paper from arXiv and Crossref", () => {
    const feed = `<feed><entry><id>http://arxiv.org/abs/math/9404236v1</id><published>1994-03-30T00:00:00Z</published>
      <title>On Proof &amp;
        Progress</title><author><name>William P. Thurston</name></author><author><name>Ann Author</name></author></entry></feed>`;
    expect(parseArxiv(feed)).toEqual({
      "math/9404236": { title: "On Proof & Progress", author: "William P. Thurston, Ann Author", venue: "arXiv", year: "1994" },
    });
    const work = {
      title: ["&lt;p&gt;Why &lt;i&gt;Most&lt;/i&gt; Findings&lt;/p&gt;"],
      author: [{ given: "John", family: "Ioannidis" }, { name: "A Consortium" }],
      "container-title": [],
      publisher: "PLoS",
      issued: { "date-parts": [[2005, 8]] },
    };
    expect(parseCrossref({ message: work })).toEqual({
      title: "Why Most Findings",
      author: "John Ioannidis, A Consortium",
      venue: "PLoS",
      year: "2005",
    });
  });
});

describe("shelve", () => {
  const READER = "https://read.readwise.io/read/abc";
  const books = {
    [`${URL}/OL1W`]: { cover: "1", title: "A", author: "X", description: "<i>d</i>", shelf: "to-read", added: "2026-01-01", read: null },
    [`https://www.example.org/b`]: {
      title: "B",
      author: "Y",
      venue: "J",
      siteName: "Bee",
      year: "2020",
      description: "",
      shelf: "read",
      added: "2026-01-01",
      read: "2026-02-02",
    },
    [READER]: { title: "C", author: "", description: "", shelf: "read", added: "2026-01-01", read: null },
  };

  const listed = { "https://www.example.org/b": { status: "read", tags: [] }, [READER]: { status: "read", tags: [] } };

  it("takes the status, type, tags, and cover from the vault, and leaves out an unlisted item", () => {
    expect(shelve(books, { [READER]: listed[READER] })).toHaveLength(1);
    const [a, b, c] = shelve(books, {
      [`${URL}/OL1W`]: { status: "read", type: "book", tags: ["mine"], finished: "2026-04-04", cover: "a.png" },
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
    expect(b).toMatchObject({
      status: "read",
      tags: [],
      finished: "2026-02-02",
      site: "example.org",
      private: false,
      venue: "J",
      year: "2020",
      siteName: "Bee",
    });
    expect(c).toMatchObject({ site: "", private: true });
  });

  it("makes a popover card with the author, venue, status, tags, and escaped description, except for a Reader link", () => {
    const cards = bookCards(shelve(books, { [`${URL}/OL1W`]: { status: "to-read", tags: ["logic", "math"] }, ...listed }));
    expect(cards[`${URL}/OL1W`]).toEqual({ title: "A", meta: ["X", "To read"], tags: ["logic", "math"], paragraphs: ["&lt;i&gt;d&lt;/i&gt;"] });
    expect(cards["https://www.example.org/b"].meta).toEqual(["Y", "J, 2020", "Read"]);
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
      [`${URL}/OL1W`]: { status: "reading", type: "book", tags: ["logic"] },
      [`${URL}/OL2W`]: {
        status: "to-read",
        type: "book",
        tags: ["history"],
        skip: true,
        owned: true,
        after: [`${URL}/OL3W`, `${URL}/OL1W`],
        cover: "Skipped Vol.png",
      },
      [`${URL}/OL3W`]: { status: "read", type: "book", tags: ["logic"] },
      [`${URL}/OL4W`]: { status: "read", type: "book", tags: [] },
      [PAPER]: { status: "read", type: "article", tags: ["logic"] },
    });

    await fs.writeFile(file, LIBRARY.replace("## To read", "## Read"));
    const today = new Date().toISOString().slice(0, 10);
    expect((await run()).finished).toEqual([{ title: "Skipped [Vol. 2]", year: today.slice(0, 4), count: 1 }]);
    expect((await library())[`${URL}/OL2W`].finished).toBe(today);
    expect((await run()).finished).toEqual([]);
    expect((await library())[`${URL}/OL2W`].finished).toBe(today);

    await fs.writeFile(path.join(path.dirname(file), "covers/nothing.jpg"), "");
    await expect(run()).rejects.toThrow(/nothing\.jpg/);
    await fs.writeFile(file, "## Shelved\n");
    await expect(run()).rejects.toThrow(SyncError);
    await fs.rm(dir, { recursive: true, force: true });
  });
});
