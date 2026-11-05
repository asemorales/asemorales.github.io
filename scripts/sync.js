import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { GLOSSARY, glossaryEntries, parseTerm } from "../src/lib/glossary.js";
import { slugify } from "../src/lib/slug.js";
import { WIKILINK } from "../src/lib/wikilinks.js";
import { classify, notesByLink } from "./build-cards.js";

const IMAGE = /\.(png|jpe?g|gif|webp|avif|svg)$/i;
const INTRODUCTION = "paratext/introduction.md";
const NOTE_KEYS = new Set(["title", "date", "tags", "unlisted"]);
const SKIP_DIRS = new Set([".git", ".obsidian", ".trash", "node_modules"]);
const IGNORED_WIKILINKS = new Set(["some private note"]);

export class SyncError extends Error {
  constructor(problems) {
    super(problems.map((p) => `  - ${p}`).join("\n"));
    this.problems = problems;
  }
}

export function gitLastUpdated(vault, file) {
  const rel = path.relative(vault, file);
  try {
    const dirty = execFileSync("git", ["-C", vault, "status", "--porcelain", "--", rel], { encoding: "utf8" });
    if (dirty.trim()) return { date: today(), source: "uncommitted" };
    const date = execFileSync("git", ["-C", vault, "log", "-1", "--format=%cs", "--", rel], { encoding: "utf8" }).trim();
    if (date) return { date, source: "git" };
  } catch {}
  return null;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function isoDate(value) {
  if (value instanceof Date && !isNaN(value)) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(new Date(value))) return value;
  return null;
}

function outsideCode(body, fn) {
  const code = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$|`[^`\n]+`/gm;
  let result = "";
  let last = 0;
  for (const m of body.matchAll(code)) {
    result += fn(body.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
  }
  return result + fn(body.slice(last));
}

function validateNote(file, data) {
  const problems = [];
  const where = `${file}:`;
  for (const key of Object.keys(data)) {
    if (!NOTE_KEYS.has(key)) problems.push(`${where} unknown front matter field "${key}". Allowed: title, date, tags, unlisted.`);
  }
  if (typeof data.title !== "string" || !data.title.trim()) problems.push(`${where} missing "title" (the note's heading, as text).`);
  if (data.date === undefined) problems.push(`${where} missing "date" (the first published date, as YYYY-MM-DD).`);
  else if (!isoDate(data.date)) problems.push(`${where} "date" must be YYYY-MM-DD, got ${JSON.stringify(data.date)}.`);
  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    problems.push(`${where} "tags" must be a list with at least one tag, like tags: [logic].`);
  } else {
    for (const tag of data.tags) {
      if (typeof tag !== "string" || !tag.trim()) problems.push(`${where} every tag must be a non-empty string, got ${JSON.stringify(tag)}.`);
      else if (tag.includes("/")) problems.push(`${where} tags are flat, so "${tag}" can't contain "/".`);
    }
  }
  if (data.unlisted !== undefined && typeof data.unlisted !== "boolean") problems.push(`${where} "unlisted" must be true or false.`);
  return problems;
}

function validateAnnotation(file, data) {
  const problems = typeof data.title === "string" && data.title.trim() ? [] : [`${file}: an annotation needs a "title" field, as text.`];
  try {
    const url = new URL(data.url);
    if (url.protocol === "http:" || url.protocol === "https:") return problems;
  } catch {}
  return [...problems, `${file}: an annotation needs a "url" field with an http or https URL.`];
}

export async function sync({ vault, out = "src/content", lastUpdated = gitLastUpdated }) {
  const published = path.join(vault, "published");
  try {
    await fs.access(published);
  } catch {
    throw new SyncError([`no published/ folder in ${vault}.`]);
  }

  const files = (await walk(published)).filter((f) => f.endsWith(".md"));
  const isAnnotation = (f) => path.relative(published, f).split(path.sep)[0] === "annotations";
  const introductionFile = path.join(published, INTRODUCTION);
  const noteFiles = files.filter((f) => !isAnnotation(f) && f !== introductionFile);

  let vaultFiles;
  const findImage = async (name) => {
    vaultFiles ??= await walk(vault);
    const direct = path.join(vault, name);
    return vaultFiles.find((f) => f === direct) ?? vaultFiles.find((f) => path.basename(f) === path.basename(name));
  };

  const problems = [];
  const report = { notes: [], annotations: [], images: [], unresolved: [] };
  const notes = [];
  const images = new Map();
  const slugs = new Map();

  for (const file of noteFiles) {
    const rel = path.relative(vault, file);
    const slug = path.basename(file, ".md");
    let parsed;
    try {
      parsed = matter(await fs.readFile(file, "utf8"));
    } catch (e) {
      problems.push(`${rel}: front matter is not valid YAML (${e.reason ?? e.message}).`);
      continue;
    }
    problems.push(...validateNote(rel, parsed.data));
    if (slug !== slugify(slug)) problems.push(`${rel}: the file name is the URL, so it must look like "${slugify(slug) || "a-title"}.md".`);
    else if (slugs.has(slug)) problems.push(`${rel}: its URL /${slug}/ is already taken by ${slugs.get(slug)}.`);
    slugs.set(slug, rel);

    const embeds = [];
    let body = outsideCode(parsed.content, (text) =>
      text.replace(/%%[\s\S]*?%%/g, "").replace(/!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (whole, target, alt) => {
        embeds.push(target);
        if (!IMAGE.test(target)) {
          problems.push(`${rel}: embedding notes (![[${target}]]) isn't supported. Link to it with [[${target}]] instead.`);
          return whole;
        }
        const ext = path.extname(target).toLowerCase();
        const name = slugify(path.basename(target, path.extname(target))) + ext;
        images.set(name, target);
        const altText = alt && !/^\d+(x\d+)?$/.test(alt.trim()) ? alt.trim() : "";
        return `![${altText}](./images/${name})`;
      }),
    );
    body = body.replace(/\n{3,}/g, "\n\n").trim() + "\n";

    const updated = lastUpdated(vault, file) ?? { date: isoDate((await fs.stat(file)).mtime), source: "mtime" };
    notes.push({ rel, slug, data: parsed.data, body, updated, embeds });
  }

  const glossary = notes.find((n) => n.slug === GLOSSARY);
  for (const [heading, definition] of glossaryEntries(glossary?.body ?? "")) {
    if (!parseTerm(heading)) problems.push(`${glossary.rel}: "## ${heading}" must look like "## word (type)".`);
    if (!definition) problems.push(`${glossary.rel}: "## ${heading}" needs a definition below it.`);
  }

  const titles = new Map(notes.map((n) => [n.slug, n.data.title]));
  for (const note of notes) {
    note.body = outsideCode(note.body, (text) =>
      text.replace(WIKILINK, (whole, rawTarget, rawHeading, alias) => {
        const target = rawTarget.trim().toLowerCase();
        const heading = rawHeading?.trim();
        if (!target) return whole;
        if (!titles.has(target)) {
          if (!IGNORED_WIKILINKS.has(target)) report.unresolved.push({ note: note.rel, target: rawTarget.trim() });
          return whole;
        }
        const title = titles.get(target);
        const word = target === GLOSSARY && heading && parseTerm(heading)?.word;
        const label = alias?.trim() || word || (heading ? `${title} > ${heading}` : title);
        const self = target === note.slug && heading;
        return `[[${self ? "" : target}${heading ? `#${heading}` : ""}|${label}]]`;
      }),
    );
  }

  const annotations = [];
  for (const file of files.filter(isAnnotation)) {
    const rel = path.relative(vault, file);
    const parsed = matter(await fs.readFile(file, "utf8"));
    problems.push(...validateAnnotation(rel, parsed.data));
    annotations.push({
      rel,
      slug: slugify(path.basename(file, ".md")),
      url: parsed.data.url,
      title: parsed.data.title,
      body: parsed.content.trim() + "\n",
    });
  }

  const sources = new Map();
  for (const [name, target] of images) {
    const source = await findImage(target);
    if (source) sources.set(name, source);
    else problems.push(`![[${target}]] isn't anywhere in the vault.`);
  }

  if (problems.length) throw new SyncError(problems);

  const byLink = notesByLink(notes.map((n) => [n.rel, n.body]));
  const annotated = new Set(annotations.map((a) => a.url));
  report.unlinkedAnnotations = annotations.filter((a) => !byLink.has(a.url)).map((a) => ({ file: a.rel, url: a.url }));
  report.unannotatedPdfs = [...byLink]
    .filter(([url]) => classify(url).kind === "pdf" && !annotated.has(url))
    .map(([url, files]) => ({ url, notes: files }));

  const notesDir = path.join(out, "notes");
  const annotationsDir = path.join(out, "annotations");
  await fs.rm(notesDir, { recursive: true, force: true });
  await fs.rm(annotationsDir, { recursive: true, force: true });
  await fs.mkdir(notesDir, { recursive: true });
  await fs.mkdir(annotationsDir, { recursive: true });
  await fs.writeFile(path.join(annotationsDir, ".gitkeep"), "");

  for (const note of notes) {
    const front = [
      "---",
      `title: ${JSON.stringify(note.data.title)}`,
      `date: ${isoDate(note.data.date)}`,
      `updated: ${note.updated.date}`,
      `tags: ${JSON.stringify(note.data.tags)}`,
      ...(note.data.unlisted ? ["unlisted: true"] : []),
      "---",
      "",
      "",
    ].join("\n");
    await fs.writeFile(path.join(notesDir, `${note.slug}.md`), front + note.body);
    report.notes.push({ file: note.rel, url: `/${note.slug}/`, updated: note.updated });
  }

  for (const a of annotations) {
    await fs.writeFile(
      path.join(annotationsDir, `${a.slug}.md`),
      `---\nurl: ${JSON.stringify(a.url)}\ntitle: ${JSON.stringify(a.title)}\n---\n\n${a.body}`,
    );
    report.annotations.push({ file: a.rel, url: a.url });
  }

  if (files.includes(introductionFile)) {
    await fs.writeFile(path.join(out, path.basename(INTRODUCTION)), matter(await fs.readFile(introductionFile, "utf8")).content.trim() + "\n");
  }

  if (sources.size) await fs.mkdir(path.join(notesDir, "images"), { recursive: true });
  for (const [name, source] of sources) {
    await fs.copyFile(source, path.join(notesDir, "images", name));
    report.images.push({ from: path.relative(vault, source), to: `images/${name}` });
  }

  return report;
}

function printReport(report) {
  console.log(`Synced ${report.notes.length} note(s) and ${report.annotations.length} annotation(s).`);
  for (const n of report.notes) console.log(`  ${n.url}`);
  for (const i of report.images) console.log(`  image ${i.from} -> ${i.to}`);
  if (report.unresolved.length) {
    console.log(`\nThese wikilinks point outside published/ and will render as plain text:`);
    for (const u of report.unresolved) console.log(`  ${u.note}: [[${u.target}]]`);
  }
  if (report.unlinkedAnnotations.length) {
    console.log(`\nThese annotations won't show, since no note links to their exact URL:`);
    for (const a of report.unlinkedAnnotations) console.log(`  ${a.file}: ${a.url}`);
  }
  if (report.unannotatedPdfs.length) {
    console.log(`\nThese PDF links have no annotation, so their popovers will have no text:`);
    for (const p of report.unannotatedPdfs) console.log(`  ${p.url} (in ${p.notes.join(", ")})`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const vault = process.env.VAULT;
  if (!vault) {
    console.error("Set VAULT to your Obsidian vault in .env, e.g.\n  VAULT=~/code/obsidian-vault");
    process.exit(1);
  }
  try {
    printReport(await sync({ vault: path.resolve(vault.replace(/^~(?=$|\/)/, process.env.HOME)) }));
  } catch (e) {
    if (!(e instanceof SyncError)) throw e;
    console.error(`Sync failed. Nothing was written.\n${e.message}`);
    process.exit(1);
  }
}
