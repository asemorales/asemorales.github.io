import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip } from "../src/lib/summary.js";
import { linksIn } from "./link-status.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARDS = path.join(root, "src/data/cards.json");
const NOTES = path.join(root, "src/content/notes");
const AGENT = "asemorales.com card builder (+https://asemorales.com)";

export function classify(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");
  const parts = u.pathname.split("/").filter(Boolean);
  if (host === "github.com" && parts.length === 2) return { kind: "github", id: `${parts[0]}/${parts[1].replace(/\.git$/, "")}` };
  if (host === "arxiv.org" && ["abs", "pdf"].includes(parts[0]) && parts[1])
    return {
      kind: "arxiv",
      id: parts
        .slice(1)
        .join("/")
        .replace(/\.pdf$/, "")
        .replace(/v\d+$/, ""),
    };
  if (host === "doi.org" || host === "dx.doi.org") return { kind: "doi", id: decodeURIComponent(u.pathname.slice(1)) };
  const wiki = host.match(/^([a-z-]+)\.(?:m\.)?wikipedia\.org$/);
  if (wiki && parts[0] === "wiki" && parts[1]) return { kind: "wikipedia", id: parts.slice(1).join("/"), lang: wiki[1] };
  return { kind: "page" };
}

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");

export function authorList(names) {
  if (names.length <= 3) return names.join(", ");
  return `${names[0]} et al.`;
}

export function parseArxiv(xml) {
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) return null;
  const tag = (t) => decode(entry.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))?.[1] ?? "").trim();
  const authors = [...entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)].map((m) => decode(m[1]).trim());
  return {
    title: tag("title").replace(/\s+/g, " "),
    meta: [authorList(authors), "arXiv", tag("published").slice(0, 4)].filter(Boolean),
    text: clip(tag("summary")),
  };
}

export function parseCrossref({ message: m }) {
  const authors = (m.author ?? []).map((a) => [a.given, a.family].filter(Boolean).join(" ") || a.name).filter(Boolean);
  const year = (m.issued ?? m.published)?.["date-parts"]?.[0]?.[0];
  return {
    title: decode(m.title?.[0] ?? ""),
    meta: [authorList(authors), decode(m["container-title"]?.[0] ?? ""), year && String(year)].filter(Boolean),
    text: m.abstract ? clip(decode(m.abstract).replace(/^\s*Abstract\s*/i, "")) : "",
  };
}

export function openalexAbstract(r) {
  const words = [];
  for (const [word, positions] of Object.entries(r?.abstract_inverted_index ?? {})) for (const i of positions) words[i] = word;
  return clip(
    words
      .filter(Boolean)
      .join(" ")
      .replace(/^\s*Abstract\s*/i, ""),
  );
}

export function parseGithub(r) {
  return {
    title: r.full_name,
    meta: ["GitHub", `★ ${r.stargazers_count.toLocaleString("en")}`],
    text: (r.description ?? "").trim(),
  };
}

export function parseWikipedia(r) {
  return { title: r.title, meta: ["Wikipedia"], text: clip(r.extract ?? "") };
}

export function parsePage(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? { title: decode(title).replace(/\s+/g, " ").trim(), meta: [], text: "" } : null;
}

async function get(url, type = "json") {
  const headers = { "User-Agent": AGENT, Accept: type === "json" ? "application/json" : "text/html,application/xml" };
  if (type === "json" && url.startsWith("https://api.github.com/") && process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return type === "json" ? res.json() : (await res.text()).slice(0, 200000);
}

export async function fetchCard(url) {
  const c = classify(url);
  switch (c.kind) {
    case "github":
      return { kind: c.kind, ...parseGithub(await get(`https://api.github.com/repos/${c.id}`)) };
    case "arxiv":
      return { kind: c.kind, ...parseArxiv(await get(`https://export.arxiv.org/api/query?id_list=${encodeURIComponent(c.id)}`, "text")) };
    case "doi": {
      const card = parseCrossref(await get(`https://api.crossref.org/works/${encodeURIComponent(c.id)}`));
      if (!card.text) card.text = openalexAbstract(await get(`https://api.openalex.org/works/doi:${encodeURIComponent(c.id)}`).catch(() => null));
      return { kind: c.kind, ...card };
    }
    case "wikipedia":
      return { kind: c.kind, ...parseWikipedia(await get(`https://${c.lang}.wikipedia.org/api/rest_v1/page/summary/${c.id}`)) };
    default: {
      const page = parsePage(await get(url, "text"));
      return page && { kind: c.kind, ...page };
    }
  }
}

async function main(refresh) {
  const cards = JSON.parse(await fs.readFile(CARDS, "utf8").catch(() => "{}"));
  const files = (await fs.readdir(NOTES)).filter((f) => f.endsWith(".md"));
  const linked = [...new Set((await Promise.all(files.map((f) => fs.readFile(path.join(NOTES, f), "utf8")))).flatMap(linksIn))].sort();
  const next = {};
  for (const url of linked) {
    if (cards[url] && !refresh) {
      next[url] = cards[url];
      continue;
    }
    try {
      const card = await fetchCard(url);
      if (card?.title) next[url] = card;
      console.log(`${card?.title ? "card" : "none"}  ${url}`);
    } catch (e) {
      if (cards[url]) next[url] = cards[url];
      console.log(`fail  ${url}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  await fs.writeFile(CARDS, JSON.stringify(next, null, 2) + "\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main(process.argv.includes("--refresh"));
