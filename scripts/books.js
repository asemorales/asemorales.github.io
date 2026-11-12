import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bookUrl, libraryRow, linkKey, parseLibrary, STATUS_LABEL, STATUSES, statusOf, TABLE_HEAD } from "../src/lib/library.js";
import { clip } from "../src/lib/summary.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BOOKS = path.join(root, "src/data/books.json");
const COVERS = path.join(root, "src/assets/covers");
const LIBRARY = "published/paratext/library.md";
const EXPORT = "goodreads_library_export.csv";
const SHELVES = { "currently-reading": "reading", "to-read": "to-read", read: "read" };
const OPEN_LIBRARY = "https://openlibrary.org";
const AGENT = "library-sync";
const PAUSE = 350;
const READER_TAG = "dani";

function parseCsv(text) {
  const rows = [[""]];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const row = rows.at(-1);
    if (quoted) {
      if (c !== '"') row[row.length - 1] += c;
      else if (text[i + 1] === '"') row[row.length - 1] += text[i++];
      else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === ",") row.push("");
    else if (c === "\n") rows.push([""]);
    else if (c !== "\r") row[row.length - 1] += c;
  }
  const [header, ...body] = rows;
  return body.filter((row) => row.length === header.length).map((row) => Object.fromEntries(header.map((name, i) => [name, row[i]])));
}

/** Books from a Goodreads library export. Books on a shelf other than the three status shelves are left out. */
export function parseExport(csv) {
  const date = (value) => (/^\d{4}\/\d{2}\/\d{2}$/.test(value) ? value.replaceAll("/", "-") : null);
  return parseCsv(csv)
    .filter((row) => row["Exclusive Shelf"] in SHELVES)
    .map((row) => ({
      url: bookUrl(row["Book Id"]),
      cover: row["Book Id"],
      title: row["Title"].replace(/\s+/g, " ").trim(),
      author: row["Author"].replace(/\s+/g, " ").trim(),
      isbn: (row["ISBN13"] || row["ISBN"]).replace(/[^\dX]/gi, ""),
      shelf: SHELVES[row["Exclusive Shelf"]],
      added: date(row["Date Added"]),
      read: date(row["Date Read"]),
    }));
}

/** Library items from Readwise Reader documents. */
export function parseReader(documents) {
  const text = (value) => (value ?? "").replace(/\s+/g, " ").trim();
  const date = (value) => value?.slice(0, 10) ?? null;
  return documents
    .filter((d) => !d.parent_id)
    .map((d) => {
      const progress = d.reading_progress ?? 0;
      const shelf = d.location === "archive" || progress >= 0.95 ? "read" : progress > 0.05 ? "reading" : "to-read";
      const source = new URL(/^https?:\/\/(?!readwise\.io\/)/.test(d.source_url ?? "") ? d.source_url : d.url);
      if (source.searchParams.has("utm_source")) source.searchParams.delete("r");
      for (const name of [...source.searchParams.keys()]) {
        if (/^(utm_.*|wprov|triedRedirect)$/.test(name)) source.searchParams.delete(name);
      }
      return {
        url: linkKey(source.href),
        title: text(d.title) || decodeURIComponent(source.pathname.split("/").findLast(Boolean) ?? source.hostname),
        author: /^https?:/.test(d.author ?? "") ? "" : text(d.author),
        description: clip(text(d.summary)),
        shelf,
        added: date(d.saved_at),
        read: shelf === "read" ? date((d.location === "archive" ? d.last_moved_at : d.last_opened_at) ?? d.saved_at) : null,
      };
    });
}

/** Adds each item that the library file does not list yet to the table under the heading of its shelf. */
export function addToLibrary(markdown, books) {
  const known = parseLibrary(markdown).entries;
  const lines = markdown.trim() ? markdown.trimEnd().split("\n") : [];
  for (const status of STATUSES) {
    const fresh = books.filter((b) => b.shelf === status && !known[b.url]).map(libraryRow);
    if (!fresh.length) continue;
    let start = lines.findIndex((l) => statusOf(l) === status);
    if (start < 0) {
      if (lines.length) lines.push("");
      start = lines.push(`## ${STATUS_LABEL[status]}`) - 1;
    }
    let end = lines.findIndex((l, i) => i > start && statusOf(l) !== undefined);
    if (end < 0) end = lines.length;
    const last = lines.findLastIndex((l, i) => i > start && i < end && l.trim().startsWith("|"));
    if (last < 0) lines.splice(start + 1, 0, "", ...TABLE_HEAD, ...fresh, ...(lines[start + 1]?.trim() ? [""] : []));
    else lines.splice(last + 1, 0, ...fresh);
  }
  return lines.join("\n") + "\n";
}

export function describe(description) {
  const text = typeof description === "string" ? description : (description?.value ?? "");
  return clip(
    text
      .split(/\r?\n\s*-{3,}|\(\[source\]/i)[0]
      .replace(/<[^>]+>/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

async function get(url) {
  await new Promise((resolve) => setTimeout(resolve, PAUSE));
  const res = await fetch(url, { headers: { "User-Agent": AGENT } });
  return res.ok ? res : null;
}

const json = async (url) => (await get(url))?.json();

async function openLibrary(book) {
  const edition = book.isbn ? await json(`${OPEN_LIBRARY}/isbn/${book.isbn}.json`) : null;
  const query = new URLSearchParams({ title: shortTitle(book), author: book.author, limit: "1", fields: "key,cover_i" });
  const found = edition?.works?.[0] ? null : (await json(`${OPEN_LIBRARY}/search.json?${query}`))?.docs?.[0];
  const key = edition?.works?.[0]?.key ?? found?.key;
  const work = key ? await json(`${OPEN_LIBRARY}${key}.json`) : null;
  const cover = [edition?.covers?.[0], work?.covers?.[0], found?.cover_i].find((id) => id > 0);
  return {
    description: describe(edition?.description) || describe(work?.description),
    cover: cover && `https://covers.openlibrary.org/b/id/${cover}-L.jpg`,
  };
}

const shortTitle = (book) => book.title.replace(/\s*(\(.*\)$|:.*)/, "");

const coverFile = (book) => path.join(COVERS, `${book.cover}.jpg`);
const hasCover = (book) =>
  fs.access(coverFile(book)).then(
    () => true,
    () => false,
  );

async function look(book) {
  const { description, cover } = await openLibrary(book);
  const image = cover && (await get(cover));
  if (image) await fs.writeFile(coverFile(book), Buffer.from(await image.arrayBuffer()));
  return description;
}

async function fetchReader(token) {
  const documents = [];
  let cursor = "";
  do {
    const res = await fetch(`https://readwise.io/api/v3/list/?tag=${READER_TAG}${cursor && `&pageCursor=${cursor}`}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) throw new Error(`Readwise answered ${res.status}`);
    const page = await res.json();
    documents.push(...page.results);
    cursor = page.nextPageCursor;
  } while (cursor);
  return documents;
}

/** Open Library is asked about each new book, and again about each book that still lacks a description or a cover. */
async function goodreads(csv, cached, save) {
  const books = parseExport(csv);
  await fs.mkdir(COVERS, { recursive: true });
  const data = {};
  let looked = 0;
  for (const { isbn, ...book } of books) {
    let description = cached[book.url]?.description;
    if (!description || !(await hasCover(book))) {
      const found = await look({ isbn, ...book }).catch((e) => console.warn(`  Open Library failed for "${book.title}": ${e.message}`));
      description = found ?? description;
      if (found !== undefined && ++looked % 25 === 0) {
        console.log(`  looked up ${looked} book(s) on Open Library`);
        await save(data);
      }
    }
    data[book.url] = { ...book, description, listed: cached[book.url]?.listed };
  }
  console.log(`Read ${books.length} book(s) from ${EXPORT} and looked up ${looked} on Open Library.`);
  return data;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const vault = process.env.VAULT && path.resolve(process.env.VAULT.replace(/^~(?=$|\/)/, process.env.HOME));
  if (!vault) {
    console.log("Skipped the library, because VAULT is not set.");
    process.exit(0);
  }
  const cached = JSON.parse(await fs.readFile(BOOKS, "utf8").catch(() => "{}"));
  const isBook = (url) => url.startsWith(bookUrl(""));
  const keep = (test) => Object.fromEntries(Object.entries(cached).filter(([url]) => test(url)));
  const write = (data) => fs.writeFile(BOOKS, JSON.stringify(data, null, 2) + "\n");

  const read = (dir) => fs.readFile(path.join(dir, EXPORT), "utf8").catch(() => null);
  const csv = (await read(vault)) ?? (await read(path.join(process.env.HOME, "Downloads")));
  if (!csv) console.log(`Kept the cached books. To pull them, save the Goodreads export as ${EXPORT} in the vault or in ~/Downloads.`);
  const books = csv ? await goodreads(csv, cached, (data) => write({ ...cached, ...data })) : keep(isBook);

  const token = process.env.READWISE_TOKEN;
  if (!token) console.log("Kept the cached Readwise documents. To pull them, set READWISE_TOKEN in .env.");
  const documents = token
    ? await fetchReader(token).then(
        (found) => Object.fromEntries(parseReader(found).map((d) => [d.url, d])),
        (e) => console.warn(`${e.message}, so the cached Readwise documents are kept.`) ?? keep((url) => !isBook(url)),
      )
    : keep((url) => !isBook(url));
  if (token) console.log(`Read ${Object.keys(documents).length} document(s) tagged ${READER_TAG} from Readwise.`);

  const data = { ...books, ...documents };
  const file = path.join(vault, LIBRARY);
  const before = await fs.readFile(file, "utf8").catch(() => "");
  const known = parseLibrary(before).entries;
  // An item that was listed once and is gone from the file was deleted there, so it stays out.
  const fresh = Object.entries(data)
    .filter(([url]) => !known[url] && !cached[url]?.listed)
    .map(([url, item]) => ({ ...item, url }));
  if (fresh.length) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, addToLibrary(before, fresh));
  }
  for (const item of Object.values(data)) item.listed = true;
  await write(data);
  console.log(fresh.length ? `Added ${fresh.length} item(s) to ${LIBRARY}.` : `${LIBRARY} lists every new item.`);
}
