import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeHTML, decodeXML } from "entities";
import sharp from "sharp";
import {
  bookUrl,
  faviconOf,
  libraryRow,
  linkKey,
  parseLibrary,
  parseRow,
  siteOf,
  STATUS_LABEL,
  STATUSES,
  statusOf,
  TABLE_HEAD,
} from "../src/lib/library.js";
import { clip } from "../src/lib/summary.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BOOKS = path.join(root, "src/data/books.json");
const COVERS = path.join(root, "src/assets/covers");
const FAVICONS = path.join(root, "src/assets/favicons");
const SITES = path.join(root, "src/data/sites.json");
const LIBRARY = "published/paratext/library.md";
const SHELVES = { "currently-reading": "reading", "want-to-read": "to-read", "already-read": "read" };
const OPEN_LIBRARY = "https://openlibrary.org";
const READWISE = "https://readwise.io";
const ARXIV = "https://export.arxiv.org/api/query";
const CROSSREF = "https://api.crossref.org/works/";
const FAVICON = "https://www.google.com/s2/favicons?sz=32&domain=";
const PAPER_FIELDS = ["title", "author", "venue", "year"];
const AGENT = "library-sync";
const PAGE = 100;
const PAUSE = 350;
const TRIES = 2;
const RETRY_PAUSE = 3000;
const TIMEOUT = 30_000;
const READER_TAG = "dani";
const IMAGE_MIN = 300;
const IMAGE_HEIGHT = 400;
const IMAGE_WIDEST = 4 / 3;
const SYNCED = ["Open Library", "Readwise"];

let verbose = false;
const say = (line) => verbose && console.log(line);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const text = (value) => (value ?? "").replace(/\s+/g, " ").trim();

/** Books from one shelf of an Open Library reading log. */
export function parseShelf(entries, shelf) {
  const date = (value) => value?.slice(0, 10).replaceAll("/", "-") ?? null;
  return entries.map(({ work, logged_edition, logged_date }) => {
    const id = work.key.split("/").at(-1);
    return {
      url: bookUrl(id),
      cover: id,
      title: text(work.title),
      author: text(work.author_names?.[0]),
      shelf,
      added: date(logged_date),
      read: shelf === "read" ? date(logged_date) : null,
      lookup: { edition: logged_edition ?? null, cover: work.cover_id ?? null },
    };
  });
}

const key = (value) => (value ?? "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

const isLink = (value) => /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(value);

/** Authors of a Reader document, or "" when Reader took a link for the author. */
export function cleanAuthor(author) {
  const value = text(author).replace(/\s*;\s*/g, ", ");
  return isLink(value) ? "" : value;
}

/** Title of a Reader document without the site's name or the byline at its end, and a file name turned into words. */
export function cleanTitle(title, author, names) {
  const drop = new Set([...names, author && `by ${author}`].filter(Boolean).map(key));
  let value = title;
  for (let m; (m = value.match(/^(.+)\s+(?:[-|–—]|::)\s+(.+)$/)) && drop.has(key(m[2]));) value = m[1];
  const byline = ` by ${author}`.toLowerCase();
  if (author && value.toLowerCase().endsWith(byline)) value = value.slice(0, -byline.length);
  const file = value.match(/^(\S+)\.(?:pdf|html?)$/i);
  return file ? file[1].replace(/[-_]+/g, " ") : value;
}

/** Name of a Reader document's site, without markup, or "" when Reader has only a link or a placeholder. */
function siteName(value) {
  const name = text((value ?? "").replace(/<(\w+)[^>]*>.*?<\/\1>|<[^>]+>/g, ""));
  return isLink(name) || name.startsWith("readwise-") ? "" : name;
}

/** Name of a site from its home page: the og:site_name, the application-name, or the title. */
export function parseSiteName(html) {
  const meta = (name) => html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, "i"))?.[0].match(/content=(["'])(.*?)\1/i)?.[2];
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1].split(/\s+\|\s+/)[0];
  return siteName(decodeHTML(meta("og:site_name") ?? meta("application-name") ?? title ?? ""));
}

/** Library items from Readwise Reader documents. */
export function parseReader(documents) {
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
      const names = [d.site_name, source.hostname.split(".").at(-2)];
      const author = cleanAuthor(d.author);
      return {
        url: linkKey(source.href),
        title: cleanTitle(text(d.title) || decodeURIComponent(source.pathname.split("/").findLast(Boolean) ?? source.hostname), author, names),
        author,
        siteName: siteName(d.site_name),
        description: clip(text(d.summary)),
        image: /^https?:\/\//.test(d.image_url ?? "") ? d.image_url : null,
        shelf,
        added: date(d.saved_at),
        read: shelf === "read" ? date((d.location === "archive" ? d.last_moved_at : d.last_opened_at) ?? d.saved_at) : null,
      };
    });
}

/** Library file with each item's row under the heading of its shelf. Rows keep their type and tags. A row from a fetched source that has no item is removed. */
export function syncLibrary(markdown, items, fetched) {
  const byUrl = new Map(items.map((item) => [item.url, item]));
  const removable = new Set(fetched.map((source) => source.toLowerCase()));
  const placed = new Set();
  const moving = new Map();
  let status = null;
  const lines = (markdown.trim() ? markdown.trimEnd().split("\n") : []).flatMap((line) => {
    const heading = statusOf(line);
    if (heading !== undefined) status = heading;
    const found = parseRow(line);
    if (!found) return [line];
    const item = byUrl.get(found.key);
    if (!item) return removable.has(found.values[3]?.toLowerCase()) ? [] : [line];
    if (placed.has(item.url)) return [];
    if (item.shelf !== status) {
      moving.set(item.url, found.values);
      return [];
    }
    placed.add(item.url);
    const updated = libraryRow(item, found.values);
    return [parseRow(updated).values.join("|") === found.values.join("|") ? line : updated];
  });
  for (const shelf of STATUSES) {
    const fresh = items.filter((b) => b.shelf === shelf && !placed.has(b.url)).map((b) => libraryRow(b, moving.get(b.url)));
    if (!fresh.length) continue;
    let start = lines.findIndex((l) => statusOf(l) === shelf);
    if (start < 0) {
      if (lines.length) lines.push("");
      start = lines.push(`## ${STATUS_LABEL[shelf]}`) - 1;
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
  const value = typeof description === "string" ? description : (description?.value ?? "");
  return clip(
    value
      .split(/\r?\n\s*-{3,}|\(\[source\]/i)[0]
      .replace(/<[^>]+>/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/** arXiv ID or DOI of a paper, read from its link, or null. */
export function paperId(url) {
  const link = new URL(url);
  const arxiv = link.hostname.endsWith("arxiv.org") && link.pathname.match(/^\/(?:abs|pdf|html)\/([a-z-]+(?:\.[a-z]{2})?\/\d{7}|\d{4}\.\d{4,5})/i);
  if (arxiv) return { arxiv: arxiv[1] };
  const host = link.hostname.replace(/^www\./, "");
  const known = {
    "nature.com": ["10.1038/", link.pathname.match(/^\/articles\/([\w.-]+)$/)?.[1]],
    "jstor.org": ["10.2307/", link.pathname.match(/^\/stable\/(\d+)$/)?.[1]],
    "papers.ssrn.com": ["10.2139/ssrn.", link.searchParams.get("abstract_id")],
  }[host];
  const doi = known?.[1]
    ? known.join("")
    : decodeURIComponent(url)
        .match(/\b10\.\d{4,9}\/[^\s?#&]+/)?.[0]
        .replace(/(\.pdf|\/(full|abstract|pdf|epdf))+\/?$/i, "");
  return doi ? { doi } : null;
}

/** Title, authors, venue, and year of each paper in an arXiv API feed, keyed by arXiv ID. */
export function parseArxiv(xml) {
  return Object.fromEntries(
    [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, entry]) => {
      const tag = (name) => decodeXML(entry.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? "");
      const names = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) => text(decodeXML(m[1])));
      const id = tag("id")
        .replace(/^.*\/abs\//, "")
        .replace(/v\d+$/, "");
      return [id, { title: text(tag("title")), author: names.join(", "), venue: "arXiv", year: tag("published").slice(0, 4) }];
    }),
  );
}

/** Title, authors, venue, and year of a paper in a Crossref work. */
export function parseCrossref({ message: work }) {
  const plain = (value) => text(decodeHTML(decodeHTML(value ?? "").replace(/<[^>]+>/g, "")));
  const names = (work.author ?? []).map((a) => text(a.name ?? [a.given, a.family].filter(Boolean).join(" ")));
  return {
    title: plain(work.title?.[0]),
    author: names.join(", "),
    venue: plain(work["container-title"]?.[0] || work.publisher),
    year: String(work.issued?.["date-parts"]?.[0]?.[0] ?? ""),
  };
}

const isDown = (res) => res instanceof Error || res.status >= 500 || res.status === 429;
const status = (res) => (res instanceof Error ? (res.name === "TimeoutError" ? "timed out" : (res.cause?.code ?? res.message)) : `${res.status}`);

/** Response or network error for a URL, asked again once when the site is down. */
async function request(url, headers = {}) {
  for (let attempt = 1; ; attempt++) {
    await sleep(PAUSE);
    const res = await fetch(url, { headers: { "User-Agent": AGENT, ...headers }, signal: AbortSignal.timeout(TIMEOUT) }).catch((e) => e);
    say(`  GET ${url}: ${status(res)}`);
    if (!isDown(res) || attempt === TRIES) return res;
    await sleep(RETRY_PAUSE);
  }
}

const json = async (url, headers) => {
  const res = await request(url, headers);
  return res.ok ? res.json() : null;
};

/** Whether a site is up, so that sync can skip a site that is down and keep its cached items. */
export async function check(name, url, headers) {
  const res = await request(url, headers);
  const up = res.ok === true;
  if (up) console.log(`${name} is up.`);
  else if (isDown(res)) console.warn(`${name} is down (${status(res)}) after ${TRIES} checks, so sync kept its cached items.`);
  else console.warn(`${name} refused the request (${status(res)}), so sync kept its cached items.`);
  return up;
}

async function fetchShelves(user) {
  const books = [];
  for (const [name, shelf] of Object.entries(SHELVES)) {
    for (let page = 1; ; page++) {
      const found = await json(`${OPEN_LIBRARY}/people/${user}/books/${name}.json?limit=${PAGE}&page=${page}`);
      if (!found) throw new Error(`Open Library failed on page ${page} of ${name}`);
      books.push(...parseShelf(found.reading_log_entries, shelf));
      if (found.reading_log_entries.length < PAGE) break;
    }
  }
  return books;
}

async function fetchReader(token) {
  const documents = [];
  let cursor = "";
  do {
    const page = await json(`${READWISE}/api/v3/list/?tag=${READER_TAG}${cursor && `&pageCursor=${cursor}`}`, { Authorization: `Token ${token}` });
    if (!page) throw new Error("Readwise failed on a page of documents");
    documents.push(...page.results);
    cursor = page.nextPageCursor;
  } while (cursor);
  return parseReader(documents);
}

const filled = (paper) => Object.fromEntries(PAPER_FIELDS.filter((field) => paper?.[field]).map((field) => [field, paper[field]]));

/** Readwise items with the title, authors, venue, and year of each paper that has an arXiv ID or a DOI. A paper in the cache keeps its fields. */
async function lookUpPapers(items, cached) {
  const ids = items.map((item) => ({ item, id: paperId(item.url), known: cached[item.url]?.venue && cached[item.url] }));
  const arxiv = ids.filter(({ id, known }) => id?.arxiv && !known).map(({ id }) => id.arxiv);
  const res = arxiv.length ? await request(`${ARXIV}?id_list=${arxiv.join(",")}&max_results=${arxiv.length}`) : null;
  const preprints = res?.ok ? parseArxiv(await res.text()) : {};
  if (res && !res.ok) console.warn(`arXiv failed (${status(res)}), so sync looks up its papers next time.`);
  let looked = 0;
  const papers = [];
  for (const { item, id, known } of ids) {
    let paper = known || (id?.arxiv && preprints[id.arxiv]);
    if (!paper && id?.doi) paper = await json(`${CROSSREF}${encodeURIComponent(id.doi)}`).then((work) => work && parseCrossref(work));
    if (paper && !known) looked++;
    if (id && !paper) say(`  No paper found for ${item.url}`);
    papers.push({ ...item, ...filled(paper) });
  }
  console.log(`Looked up ${looked} paper(s) on arXiv and Crossref.`);
  return papers;
}

const exists = (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  );

/** Saves the favicon of each host that lacks one. */
async function fetchFavicons(hosts) {
  await fs.mkdir(FAVICONS, { recursive: true });
  let saved = 0;
  for (const host of hosts) {
    const file = path.join(FAVICONS, `${host}.png`);
    if (await exists(file)) continue;
    const res = await request(`${FAVICON}${host}`);
    if (!res.ok) continue;
    await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    saved++;
  }
  console.log(`Saved ${saved} favicon(s).`);
}

export function imageSize({ width, height }) {
  if (width < IMAGE_MIN || height < IMAGE_MIN) return null;
  const h = Math.min(height, IMAGE_HEIGHT);
  return { width: Math.round(Math.min(width / height, IMAGE_WIDEST) * h), height: h };
}

async function readerCovers(documents, cached) {
  let saved = 0;
  for (const d of documents) {
    if (!d.image) continue;
    const cover = createHash("sha1").update(d.url).digest("hex").slice(0, 16);
    const file = path.join(COVERS, `${cover}.jpg`);
    if (await exists(file)) {
      d.cover = cover;
      continue;
    }
    if (cached[d.url]?.image === d.image) continue;
    const res = await request(d.image);
    const body = res.ok && (await res.arrayBuffer().catch(() => null));
    if (!body?.byteLength) {
      d.image = null;
      continue;
    }
    const image = sharp(Buffer.from(body), { failOn: "none" });
    const size = imageSize(await image.metadata().catch(() => ({ width: 0, height: 0 })));
    if (!size) continue;
    const done = await image
      .resize({ ...size, fit: "cover" })
      .flatten({ background: "#fff" })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(file)
      .catch(() => null);
    if (!done) continue;
    d.cover = cover;
    saved++;
  }
  console.log(`Saved ${saved} Reader image(s) as covers.`);
}

/** Names of sites, each read once from the site's home page. A site that refuses the request is saved without a name. */
async function fetchSiteNames(hosts) {
  const names = JSON.parse(await fs.readFile(SITES, "utf8").catch(() => "{}"));
  for (const host of hosts) {
    if (host in names) continue;
    const res = await request(`https://${host}/`);
    if (res instanceof Error || isDown(res)) continue;
    names[host] = res.ok ? parseSiteName(await res.text()) : "";
    say(`  Site name of ${host}: ${names[host] || "none"}`);
  }
  await fs.writeFile(SITES, JSON.stringify(Object.fromEntries(Object.entries(names).sort()), null, 2) + "\n");
  return names;
}

const coverFile = (book) => path.join(COVERS, `${book.cover}.jpg`);
const hasCover = (book) => exists(coverFile(book));

/** Description of a book, after its cover is saved. */
async function lookUp(book, { edition, cover: logged }) {
  const found = edition ? await json(`${OPEN_LIBRARY}${edition}.json`) : null;
  const work = describe(found?.description) ? null : await json(`${book.url}.json`);
  const description = describe(found?.description) || describe(work?.description);
  const cover = [found?.covers?.[0], logged, work?.covers?.[0]].find((id) => id > 0);
  const image = cover && !(await hasCover(book)) && (await request(`https://covers.openlibrary.org/b/id/${cover}-L.jpg`));
  if (image?.ok) await fs.writeFile(coverFile(book), Buffer.from(await image.arrayBuffer()));
  say(`  Looked up "${book.title}": ${description ? "found" : "no"} description, ${cover ? "found" : "no"} cover.`);
  return description;
}

/** Books from Open Library. A cached book keeps its title, author, and dates. Each book that lacks a description or a cover is looked up again. */
async function openLibrary(user, cached, save) {
  const books = await fetchShelves(user);
  await fs.mkdir(COVERS, { recursive: true });
  const data = {};
  let looked = 0;
  for (const { lookup, ...book } of books) {
    say(`  Open Library, ${STATUS_LABEL[book.shelf]}: ${[book.title, book.author].filter(Boolean).join(" by ")}`);
    const known = cached[book.url];
    let description = known?.description;
    if (!description || !(await hasCover(book))) {
      const found = await lookUp(book, lookup).catch((e) => console.warn(`  Lookup failed for "${book.title}": ${e.message}`));
      description = found ?? description;
      if (found !== undefined && ++looked % 25 === 0) {
        console.log(`  Looked up ${looked} book(s).`);
        await save(data);
      }
    }
    const kept = known && { title: known.title, author: known.author, added: known.added, read: known.shelf === book.shelf ? known.read : book.read };
    data[book.url] = { ...book, ...kept, description, source: "Open Library" };
  }
  console.log(`Read ${books.length} book(s) from Open Library and looked up ${looked}.`);
  return data;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verbose = process.argv.includes("--log-verbose");
  const vault = process.env.VAULT && path.resolve(process.env.VAULT.replace(/^~(?=$|\/)/, process.env.HOME));
  if (!vault) {
    console.log("Skipped the library, because VAULT is not set.");
    process.exit(0);
  }
  const cached = JSON.parse(await fs.readFile(BOOKS, "utf8").catch(() => "{}"));
  const write = (data) => fs.writeFile(BOOKS, JSON.stringify(data, null, 2) + "\n");
  let data = { ...cached };
  const fetched = [];
  const replace = (source, items) => {
    data = { ...Object.fromEntries(Object.entries(data).filter(([, item]) => item.source !== source)), ...items };
    fetched.push(source);
  };

  const user = process.env.OPEN_LIBRARY_USER;
  if (!user) console.log("Kept the cached Open Library books. To pull them, set OPEN_LIBRARY_USER in .env.");
  else if (await check("Open Library", `${OPEN_LIBRARY}/people/${user}/books/currently-reading.json?limit=1`)) {
    await openLibrary(user, cached, (books) => write({ ...cached, ...books })).then(
      (books) => replace("Open Library", books),
      (e) => console.warn(`${e.message}, so sync kept the cached Open Library books.`),
    );
  }

  const token = process.env.READWISE_TOKEN;
  const auth = { Authorization: `Token ${token}` };
  if (!token) console.log("Kept the cached Readwise documents. To pull them, set READWISE_TOKEN in .env.");
  else if (await check("Readwise", `${READWISE}/api/v2/auth/`, auth)) {
    await fetchReader(token)
      .then((documents) => lookUpPapers(documents, cached))
      .then(async (documents) => {
        await fs.mkdir(COVERS, { recursive: true });
        await readerCovers(documents, cached);
        return documents;
      })
      .then(
        (documents) => {
          for (const d of documents) say(`  Readwise, ${STATUS_LABEL[d.shelf]}: ${d.title}`);
          console.log(`Read ${documents.length} document(s) tagged ${READER_TAG} from Readwise.`);
          replace("Readwise", Object.fromEntries(documents.map((d) => [d.url, { ...d, source: "Readwise" }])));
        },
        (e) => console.warn(`${e.message}, so sync kept the cached Readwise documents.`),
      );
  }

  const file = path.join(vault, LIBRARY);
  const before = await fs.readFile(file, "utf8").catch(() => "");
  const items = Object.entries(data)
    .filter(([, item]) => SYNCED.includes(item.source))
    .map(([url, item]) => ({ ...item, url }));
  const after = syncLibrary(before, items, fetched);
  if (after.trim() !== before.trim()) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, after);
  }
  const listed = parseLibrary(after).entries;
  const host = (item) => siteOf(item.url, "website");
  const websites = items.filter((item) => listed[item.url]?.type === "website" && host(item));
  await fetchFavicons(new Set(websites.map((item) => faviconOf(host(item)))));
  const names = await fetchSiteNames(new Set(websites.filter((item) => !item.siteName).map(host)));
  for (const item of websites) if (!item.siteName && names[host(item)]) data[item.url].siteName = names[host(item)];
  await write(data);
  const [old, now] = [before, after].map((markdown) => parseLibrary(markdown).entries);
  const added = Object.keys(now).filter((url) => !old[url]).length;
  const moved = Object.keys(now).filter((url) => old[url] && old[url].status !== now[url].status).length;
  const removed = Object.keys(old).filter((url) => !now[url]).length;
  console.log(`${LIBRARY}: added ${added}, moved ${moved}, and removed ${removed} item(s).`);
}
