// Submits each external link in the notes to the Wayback Machine's Save Page
// Now, once, so a link that later dies has a copy near the day the note first
// linked it. Submitted links are recorded in src/data/archived.json. CI runs
// this after a deploy to main and commits the record. Builds never submit.
//
//   ARCHIVE_ACCESS_KEY=… ARCHIVE_SECRET_KEY=… node scripts/archive-links.js
//   node scripts/archive-links.js --dry-run
//
// Without keys it only prints what it would submit. The keys come from
// archive.org/account/s3.php. Requests go one at a time with a pause between
// them, skip pages captured in the last month, and stop at the first 429,
// leaving the rest for the next run.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { linksIn } from "./link-status.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const NOTES = path.join(root, "src/content/notes");
const ARCHIVED = path.join(root, "src/data/archived.json");
const AGENT = "asemorales.com link-archiver (+https://asemorales.com)";
const SAVE = "https://web.archive.org/save";
const PAUSE = 6000;

// Linked URLs never submitted, in a stable order.
export function pending(linked, archived) {
  return [...new Set(linked)].filter((url) => !archived[url]).sort();
}

// Submits each URL in turn and records the ones Save Page Now accepted.
// Returns why it stopped early, if it did.
export async function archiveAll(urls, archived, { key, secret, today, fetch = globalThis.fetch, pause = PAUSE, log = console.log }) {
  for (const [i, url] of urls.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, pause));
    const res = await fetch(SAVE, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `LOW ${key}:${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": AGENT,
      },
      body: new URLSearchParams({ url, if_not_archived_within: "30d", skip_first_archive: "1" }),
      signal: AbortSignal.timeout(60000),
    });
    if (res.status === 429) {
      const wait = res.headers.get("Retry-After");
      return `rate limited${wait ? `, retry after ${wait}s` : ""}; ${urls.length - i} left for the next run`;
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.job_id) {
      // Unreachable pages and the like. Not recorded, so the next run tries again.
      log(`fail  ${url}: ${body.message ?? `${res.status} ${res.statusText}`}`);
      continue;
    }
    archived[url] = { submitted: today, job: body.job_id };
    log(`saved ${url}`);
  }
  return null;
}

async function main(dryRun) {
  const { ARCHIVE_ACCESS_KEY: key, ARCHIVE_SECRET_KEY: secret } = process.env;
  const archived = JSON.parse(await fs.readFile(ARCHIVED, "utf8").catch(() => "{}"));
  const files = (await fs.readdir(NOTES)).filter((f) => f.endsWith(".md"));
  const linked = (await Promise.all(files.map((f) => fs.readFile(path.join(NOTES, f), "utf8")))).flatMap(linksIn);
  const todo = pending(linked, archived);
  if (todo.length === 0) return console.log("Nothing new to archive.");
  if (dryRun || !key || !secret) {
    console.log(`Would submit ${todo.length} link(s):\n${todo.join("\n")}`);
    return undefined;
  }
  const stopped = await archiveAll(todo, archived, { key, secret, today: new Date().toISOString().slice(0, 10) });
  const sorted = Object.fromEntries(Object.entries(archived).sort(([a], [b]) => a.localeCompare(b)));
  await fs.writeFile(ARCHIVED, JSON.stringify(sorted, null, 2) + "\n");
  if (stopped) console.log(`Stopped: ${stopped}.`);
  return undefined;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main(process.argv.includes("--dry-run"));
