import { getCollection, render } from "astro:content";
import cards from "../data/cards.json";
import linkStatus from "../data/links-status.json";
import { archived } from "../lib/dead-links.js";
import { GLOSSARY } from "../lib/glossary.js";
import { headingCards, linkCard, noteCard, paragraphHtml, termCards } from "../lib/popovers.js";

interface Source {
  url: string;
  text: string;
}

export async function GET() {
  const notes = await getCollection("notes");
  const annotations = new Map((await getCollection("annotations")).map((a) => [a.data.url, { title: a.data.title, body: a.body }]));
  const out: Record<string, unknown> = {};
  for (const note of notes) {
    const body = note.body ?? "";
    out[`/${note.id}/`] = noteCard(note.data.title, body);
    const sections = { ...headingCards(body), ...(note.id === GLOSSARY ? termCards(body) : {}) };
    for (const [id, card] of Object.entries(sections)) out[`/${note.id}/#${id}`] = card;
    const { remarkPluginFrontmatter: fm } = await render(note);
    for (const { url, text } of [...((fm.references ?? []) as Source[]), ...((fm.externalLinks ?? []) as Source[])]) {
      if (out[url]) continue;
      const dead = archived(url, linkStatus);
      const card = linkCard({
        url,
        text,
        card: (cards as Record<string, { title: string; meta: string[]; text: string }>)[url],
        annotation: annotations.get(url),
        deadSince: dead ? (dead.since ?? "") : undefined,
      });
      out[url] = card;
      if (dead) out[dead.href] = card;
    }
  }
  for (const card of Object.values(out) as { paragraphs: string[]; epigraph?: { text: string } }[]) {
    card.paragraphs = card.paragraphs.map(paragraphHtml);
    if (card.epigraph) card.epigraph.text = paragraphHtml(card.epigraph.text);
  }
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
}
