// Posts each newly published note to Mathstodon: its title, opening paragraph,
// and link. Posted notes are recorded in src/data/posted.json, so each is
// posted once. CI runs this after a deploy to main and commits the record.
//
//   MASTODON_INSTANCE=https://mathstodon.xyz MASTODON_TOKEN=… node scripts/crosspost.js
//   node scripts/crosspost.js --dry-run
//
// Without a token it only prints what it would post. The token needs the
// write:statuses scope. Unlisted notes are never posted.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { clip, summary } from "../src/lib/summary.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const NOTES = path.join(root, "src/content/notes");
const POSTED = path.join(root, "src/data/posted.json");
const SITE = "https://asemorales.com";
// Mastodon counts every link as 23 characters, whatever its length.
const LIMIT = 500;
const LINK = 23;

// The post: title, opening paragraph cut to fit, and the link. Inline TeX
// stays as \( \) so clients that render it can, and reads fine raw otherwise.
export function compose({ title, body, slug }) {
  const url = `${SITE}/${slug}/`;
  const lead = (summary(body, { paragraphs: 1 })[0] ?? "").replace(/\$([^$\n]+)\$/g, "\\($1\\)");
  const room = LIMIT - LINK - title.length - 4;
  return [title, clip(lead, room), url].filter(Boolean).join("\n\n");
}

// Listed notes not yet posted, oldest first, so a backlog posts in order.
export function pending(notes, posted) {
  return notes.filter((n) => !n.unlisted && !posted[n.slug]).sort((a, b) => a.date.localeCompare(b.date));
}

async function readNotes() {
  const files = (await fs.readdir(NOTES)).filter((f) => f.endsWith(".md"));
  return Promise.all(
    files.map(async (f) => {
      const { data, content } = matter(await fs.readFile(path.join(NOTES, f), "utf8"));
      const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date);
      return { slug: f.replace(/\.md$/, ""), title: data.title, date, unlisted: Boolean(data.unlisted), body: content };
    }),
  );
}

async function post(instance, token, status, slug) {
  const res = await fetch(new URL("/api/v1/statuses", instance), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Idempotency-Key": `asemorales-${slug}` },
    body: JSON.stringify({ status, visibility: "public", language: "en" }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()).url;
}

async function main(dryRun) {
  const { MASTODON_INSTANCE: instance, MASTODON_TOKEN: token } = process.env;
  const posted = JSON.parse(await fs.readFile(POSTED, "utf8").catch(() => "{}"));
  const todo = pending(await readNotes(), posted);
  if (todo.length === 0) return console.log("Nothing new to post.");
  for (const note of todo) {
    const status = compose(note);
    if (dryRun || !instance || !token) {
      console.log(`Would post /${note.slug}/:\n${status}\n`);
      continue;
    }
    const url = await post(instance, token, status, note.slug);
    posted[note.slug] = { mathstodon: url, date: new Date().toISOString().slice(0, 10) };
    await fs.writeFile(POSTED, JSON.stringify(posted, null, 2) + "\n");
    console.log(`Posted /${note.slug}/: ${url}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main(process.argv.includes("--dry-run"));
