import { getCollection } from "astro:content";
import books from "../data/books.json";
import cards from "../data/cards.json";
import library from "../data/library.json";
import linkStatus from "../data/links-status.json";
import { archived } from "../lib/dead-links.js";
import { GLOSSARY } from "../lib/glossary.js";
import { bookCards, shelve } from "../lib/library.js";
import { linkedSources } from "../lib/notes";
import type { CardText } from "../types";
import { headingCards, linkCard, noteCard, paragraphHtml, termCards } from "../lib/popovers.js";

function renderText(card: CardText) {
  card.paragraphs = card.paragraphs.map(paragraphHtml);
  if (card.epigraph) card.epigraph.text = paragraphHtml(card.epigraph.text);
  card.sections?.forEach(renderText);
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
    for (const { url, text } of await linkedSources(note)) {
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
  (Object.values(out) as CardText[]).forEach(renderText);
  Object.assign(out, bookCards(shelve(books, library)));
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
}
