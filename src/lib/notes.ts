import { getCollection, render } from "astro:content";
import type { CollectionEntry } from "astro:content";
import cards from "../data/cards.json";
import type { Source } from "../types";
import { sourceEntry } from "./sources.js";
import { linkTargets } from "./wikilinks.js";

type Frontmatter = Awaited<ReturnType<typeof render>>["remarkPluginFrontmatter"];

export async function backlinksTo(note: CollectionEntry<"notes">) {
  return (await getCollection("notes", (n) => n.id !== note.id))
    .filter((n) => linkTargets(n.body ?? "").includes(note.id))
    .sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export async function sourceLists(frontmatter: Frontmatter) {
  const annotations = new Map((await getCollection("annotations")).map((a) => [a.data.url, a]));
  const withAnnotations = (sources: Source[] = [], cited = false) =>
    Promise.all(
      sources.map(async (s) => {
        if (!s.url) return { ...s, domain: null, Annotation: null };
        const card = (cards as Record<string, { meta?: string[]; text?: string }>)[s.url];
        const { text, domain, annotation } = sourceEntry({ ...s, url: s.url, card, annotation: annotations.get(s.url), cited });
        return { ...s, text, domain, Annotation: annotation ? (await render(annotation)).Content : null };
      }),
    );
  return [
    {
      id: "references",
      title: "References",
      count: (n: number) => (n === 1 ? "1 reference" : `${n} references`),
      entries: await withAnnotations(frontmatter.references as Source[], true),
    },
    {
      id: "external-links",
      title: "External links",
      count: (n: number) => (n === 1 ? "1 link" : `${n} links`),
      entries: await withAnnotations(frontmatter.externalLinks as Source[]),
    },
  ].filter((l) => l.entries.length > 0);
}
