import { getCollection, render } from "astro:content";
import type { CollectionEntry } from "astro:content";
import cards from "../data/cards.json";
import type { Source } from "../types";
import { sourceEntry } from "./sources.js";
import { seeAlsoLists } from "./wikilinks.js";

type Frontmatter = Awaited<ReturnType<typeof render>>["remarkPluginFrontmatter"];

export async function seeAlso(note: CollectionEntry<"notes">) {
  return seeAlsoLists(note, await getCollection("notes")) as { count: (n: number) => string; notes: CollectionEntry<"notes">[] }[];
}

export async function sourceLists(frontmatter: Frontmatter) {
  const entries = (sources: Source[] = [], cited = false) =>
    sources.map((s) => {
      if (!s.url) return { ...s, domain: null };
      const card = (cards as Record<string, { meta?: string[]; text?: string }>)[s.url];
      return { ...s, ...sourceEntry({ ...s, url: s.url, card, cited }) };
    });
  return [
    {
      id: "references",
      title: "References",
      count: (n: number) => (n === 1 ? "1 reference" : `${n} references`),
      entries: entries(frontmatter.references as Source[], true),
    },
    {
      id: "external-links",
      title: "External links",
      count: (n: number) => (n === 1 ? "1 link" : `${n} links`),
      entries: entries(frontmatter.externalLinks as Source[]),
    },
  ].filter((l) => l.entries.length > 0);
}
