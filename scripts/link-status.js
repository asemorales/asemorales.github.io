import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEAD_AFTER } from "../src/lib/dead-links.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATUS = path.join(root, "src/data/links-status.json");
const NOTES = path.join(root, "src/content/notes");

const LINK = /\]\((https?:\/\/[^)\s]+)|<(https?:\/\/[^>\s]+)>/g;

export function linksIn(markdown) {
  return [...markdown.matchAll(LINK)].map((m) => m[1] ?? m[2]);
}

export function failedUrls(report) {
  const maps = [report.fail_map, report.error_map].filter(Boolean);
  return new Set(
    maps.flatMap((m) =>
      Object.values(m)
        .flat()
        .map((r) => r.url),
    ),
  );
}

export function update(status, linked, failed, today) {
  const next = {};
  for (const url of [...new Set(linked)].sort()) {
    const entry = { firstSeen: today, failures: 0, ...status[url] };
    if (failed.has(url)) {
      entry.failures++;
      if (entry.failures >= DEAD_AFTER) entry.deadSince ??= today;
    } else {
      entry.failures = 0;
      delete entry.deadSince;
    }
    next[url] = entry;
  }
  return next;
}

async function main(reportPath) {
  const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
  const status = JSON.parse(await fs.readFile(STATUS, "utf8"));
  const files = (await fs.readdir(NOTES)).filter((f) => f.endsWith(".md"));
  const linked = (await Promise.all(files.map((f) => fs.readFile(path.join(NOTES, f), "utf8")))).flatMap(linksIn);
  const next = update(status, linked, failedUrls(report), new Date().toISOString().slice(0, 10));
  await fs.writeFile(STATUS, JSON.stringify(next, null, 2) + "\n");
  const dead = Object.entries(next).filter(([, e]) => e.failures >= DEAD_AFTER);
  console.log(`${Object.keys(next).length} link(s), ${dead.length} dead.`);
  for (const [url, e] of dead) console.log(`  dead since ${e.deadSince}: ${url}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) {
    console.error("Usage: node scripts/link-status.js <lychee.json>");
    process.exit(1);
  }
  await main(process.argv[2]);
}
