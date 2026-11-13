import { escapeText } from "entities";

export const STATUSES = ["reading", "to-read", "read"];
export const STATUS_LABEL = { reading: "Currently reading", "to-read": "To read", read: "Read" };
export const bookUrl = (id) => `https://openlibrary.org/works/${id}`;
export const SOURCES = ["Open Library", "Readwise", "Goodreads"];
export const itemCount = (n) => `(${n} ${n === 1 ? "item" : "items"})`;

const DAY = 864e5;
const FIRST_INTERVAL = 30;
const LONGEST_INTERVAL = 480;
const RECENT = 3;
const PHYSICAL_GAP = 3;
const FICTION = "fiction";
const LINK = /\[.*?\]\((https?:\/\/[^)\s]+)\)/g;
const TITLE = /^\[(.*)\]\((https?:\/\/[^)\s]+)\)$/;
const FLAGS = ["skip", "owned"];
const HEADER = ["Title", "Author", "Type", "Source", "Tags"];
const HEADINGS = STATUSES.map((s) => `"${STATUS_LABEL[s]}"`).join(", ");
const PRIVATE = /^https:\/\/read\.readwise\.io\//;

/** Key of a library item: its link, with an Open Library work link cut down to the work's ID. */
export function linkKey(url) {
  const book = url.match(/^https?:\/\/(?:www\.)?openlibrary\.org\/works\/(OL\d+W)/);
  return book ? bookUrl(book[1]) : url.replace(/\(/g, "%28").replace(/\)/g, "%29");
}

/** Only the owner can open a Reader link, so the page shows such an item without a link. */
export const isPrivate = (url) => PRIVATE.test(url);

export const TYPES = ["book", "article", "website"];
export const TYPE_LABEL = { book: "Book", article: "Research article", website: "Website" };
const ARTICLE =
  /(^|\.)(arxiv\.org|philpapers\.org|dl\.acm\.org|jstor\.org|papers\.ssrn\.com|sciencedirect\.com|link\.springer\.com|onlinelibrary\.wiley\.com|academic\.oup\.com|journals\.plos\.org|iopscience\.iop\.org|mdpi\.com|projecteuclid\.org|pmc\.ncbi\.nlm\.nih\.gov|econpapers\.repec\.org|hal\.science)$/;

/** Type of a new item, guessed from its link. */
export function typeOf(url) {
  if (url.startsWith(bookUrl(""))) return "book";
  return ARTICLE.test(new URL(url).hostname) ? "article" : "website";
}

export const faviconOf = (site) => (site.endsWith(".substack.com") ? "substack.com" : site);
export const siteOf = (url, type) => (type === "book" || isPrivate(url) ? "" : new URL(url).hostname.replace(/^www\./, ""));

/** Status named by a heading line, null for any other heading, undefined for other lines. */
export function statusOf(line) {
  const heading = line.match(/^#{1,6}\s+(.+?)\s*$/)?.[1].toLowerCase();
  if (heading === undefined) return undefined;
  return STATUSES.find((s) => STATUS_LABEL[s].toLowerCase() === heading) ?? null;
}

const cells = (line) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"));
const row = (values) => `| ${values.map((value) => value.replace(/\|/g, "\\|")).join(" | ")} |`;

export const TABLE_HEAD = [row(HEADER), row(HEADER.map(() => "---"))];
export const libraryRow = (book, [, , type = TYPE_LABEL[typeOf(book.url)], , ...tags] = []) =>
  row([`[${book.title}](${book.url})`, book.author, type, book.source, ...(tags.length ? tags : [""])]);

/** Key and cells of a table row that links an item, or null for any other line. */
export function parseRow(line) {
  if (!line.trim().startsWith("|")) return null;
  const values = cells(line);
  const m = values[0].match(TITLE);
  return m && { key: linkKey(m[2]), values };
}

export function parseLibrary(markdown) {
  const entries = {};
  const problems = [];
  let status = null;
  markdown.split("\n").forEach((line, i) => {
    const heading = statusOf(line);
    if (heading !== undefined) {
      status = heading;
      if (!status) problems.push(`line ${i + 1}: the heading must be one of ${HEADINGS}.`);
      return;
    }
    if (!line.trim().startsWith("|")) return;
    const [first, , kind = "", source = "", ...others] = cells(line);
    if (first === HEADER[0] || /^:?-+:?$/.test(first)) return;
    const m = first.match(TITLE);
    if (!m) return problems.push(`line ${i + 1}: the first cell of a row must look like "[Title](https://example.com)".`);
    if (!status) return problems.push(`line ${i + 1}: the row must come after one of the headings ${HEADINGS}.`);
    const type = TYPES.find((t) => TYPE_LABEL[t].toLowerCase() === kind.toLowerCase());
    if (!type) return problems.push(`line ${i + 1}: the type must be one of ${TYPES.map((t) => `"${TYPE_LABEL[t]}"`).join(", ")}.`);
    if (!SOURCES.some((s) => s.toLowerCase() === source.toLowerCase())) {
      return problems.push(`line ${i + 1}: the source must be one of ${SOURCES.map((s) => `"${s}"`).join(", ")}.`);
    }
    const marks = others.join(" ");
    const after = [...marks.matchAll(LINK)].map((link) => linkKey(link[1]));
    const rest = marks.replace(LINK, "");
    const tags = [...new Set([...rest.matchAll(/#([\w-]+)/g)].map((t) => t[1].toLowerCase()))];
    entries[linkKey(m[2])] = {
      title: m[1],
      status,
      type,
      tags: tags.filter((t) => !FLAGS.includes(t)),
      ...Object.fromEntries(FLAGS.filter((flag) => tags.includes(flag)).map((flag) => [flag, true])),
      ...(after.length && { after }),
    };
  });
  return { entries, problems };
}

/** The fetched items that the vault lists, with the vault's status, tags, and cover. */
export function shelve(books, library) {
  return Object.entries(books).flatMap(([url, book]) => {
    const entry = library[url];
    if (!entry) return [];
    return {
      url,
      cover: entry.cover ?? book.cover,
      site: siteOf(url, entry.type),
      siteName: book.siteName ?? "",
      private: isPrivate(url),
      title: book.title,
      author: book.author,
      venue: book.venue ?? "",
      year: book.year ?? "",
      description: book.description,
      added: book.added,
      status: entry.status,
      type: entry.type,
      tags: entry.tags,
      skip: !!entry.skip,
      owned: !!entry.owned,
      after: entry.after ?? [],
      finished: entry.status === "read" ? (entry.finished ?? book.read ?? null) : null,
    };
  });
}

/** Popover cards keyed by book URL, with paragraphs as HTML. */
export function bookCards(shelved) {
  return Object.fromEntries(
    shelved
      .filter((b) => !b.private)
      .map((b) => [
        new URL(b.url).href,
        {
          title: b.title,
          meta: [b.author, [b.venue, b.year].filter(Boolean).join(", "), STATUS_LABEL[b.status]].filter(Boolean),
          ...(b.tags.length && { tags: b.tags }),
          paragraphs: b.description ? [escapeText(b.description)] : [],
        },
      ]),
  );
}

function similarity(a, b) {
  if (a.author && a.author === b.author) return 1;
  const shared = a.tags.filter((t) => b.tags.includes(t)).length;
  return shared ? shared / (a.tags.length + b.tags.length - shared) : 0;
}

const closest = (book, others) => others.map((other) => ({ other, sim: similarity(book, other) })).sort((a, b) => b.sim - a.sim)[0];

/**
 * Ranks the to-read books for a reader with several books open at once. The score is a weighted mean, and each part weighs more than the next.
 * A book stays out of the ranking until its prerequisites are read, and ranks higher when it is a prerequisite itself.
 * Spacing returns to a tag once its interval has passed. The interval doubles with each finished book in that tag.
 * Interleaving moves away from the tags of the books finished most recently.
 * Non-interference avoids overlap with the books being read now.
 * Genre alternates between fiction and non-fiction.
 * A physical copy ranks higher as more digital reads pass since the last physical one.
 */
export function suggest(shelved, today) {
  const now = Date.parse(today);
  const reading = shelved.filter((b) => b.status === "reading");
  const read = shelved.filter((b) => b.status === "read" && b.finished).sort((a, b) => b.finished.localeCompare(a.finished));
  const recent = read.slice(0, RECENT);
  const active = new Set(reading.flatMap((b) => b.tags));
  const topics = new Map();
  for (const b of read) {
    for (const tag of b.tags) {
      const topic = topics.get(tag) ?? { count: 0, last: b.finished };
      topic.count++;
      topics.set(tag, topic);
    }
  }

  const unread = new Map(shelved.filter((b) => b.status !== "read").map((b) => [b.url, b]));
  const prerequisites = (book) => {
    const next = [...unread.values()].find((b) => b.after.includes(book.url));
    if (next) return { score: 1, why: `before ${next.title}` };
    return { score: 0.5, why: book.after.length ? "all read" : "none" };
  };

  const spacing = (book) => {
    const due = book.tags
      .filter((tag) => topics.has(tag))
      .map((tag) => {
        const { count, last } = topics.get(tag);
        const interval = Math.min(LONGEST_INTERVAL, FIRST_INTERVAL * 2 ** (count - 1));
        const elapsed = Math.round((now - Date.parse(last)) / DAY);
        return { tag, interval, elapsed, score: active.has(tag) ? 0 : Math.min(1, elapsed / interval) };
      })
      .sort((a, b) => b.score - a.score)[0];
    if (!due) return { score: 0.5, why: "no shared tags" };
    if (active.has(due.tag)) return { score: 0, why: `currently reading ${due.tag}` };
    return { score: due.score, why: `${due.tag} was last finished ${due.elapsed} days ago` };
  };

  const interleaving = (book) => {
    if (!recent.length) return { score: 1, why: "no recent books" };
    const weights = recent.map((_, i) => 0.5 ** i);
    const echo = recent.reduce((sum, other, i) => sum + weights[i] * similarity(book, other), 0) / weights.reduce((a, b) => a + b);
    const near = closest(book, recent);
    return {
      score: 1 - echo,
      why: near.sim ? `similar to ${near.other.title}` : "differs from recent books",
    };
  };

  const nonInterference = (book) => {
    if (!reading.length) return { score: 1, why: "nothing currently reading" };
    const near = closest(book, reading);
    return {
      score: 1 - near.sim,
      why: near.sim ? `overlaps with ${near.other.title}` : "no overlap with currently reading",
    };
  };

  const genreOf = (book) => (book.tags.includes(FICTION) ? "fiction" : "non-fiction");
  const genre = (book) => {
    if (!read.length) return { score: 0.5, why: genreOf(book) };
    const same = genreOf(book) === genreOf(read[0]);
    return { score: same ? 0 : 1, why: genreOf(book) };
  };

  const lastPhysical = reading.some((b) => b.owned) ? 0 : read.findIndex((b) => b.owned);
  const digitalReads = lastPhysical < 0 ? Infinity : lastPhysical;
  const rested = Math.min(1, digitalReads / PHYSICAL_GAP);
  const physicalCopy = (book) => ({
    score: book.owned ? rested : 1 - rested,
    why: book.owned ? "available" : "none",
  });

  return shelved
    .filter((b) => b.status === "to-read" && !b.skip && !b.after.some((url) => unread.has(url)))
    .map((book) => {
      const parts = [
        { name: "Prerequisites", ...prerequisites(book) },
        { name: "Spacing", ...spacing(book) },
        { name: "Interleaving", ...interleaving(book) },
        { name: "Non-interference", ...nonInterference(book) },
        { name: "Genre", ...genre(book) },
        { name: "Physical copy", ...physicalCopy(book) },
      ];
      return { book, parts, score: parts.reduce((sum, p, i) => sum + (parts.length - i) * p.score, 0) };
    })
    .sort((a, b) => b.score - a.score || (a.book.added ?? "").localeCompare(b.book.added ?? "") || a.book.title.localeCompare(b.book.title));
}
