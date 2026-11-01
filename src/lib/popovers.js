import GithubSlugger, { slug } from "github-slugger";
import { texToInlineSvg } from "./feed.js";
import { glossaryEntries, parseTerm } from "./glossary.js";
import { BACK_IDS } from "./rehype-sections.js";
import { clip, plain, summary } from "./summary.js";

const NOTE_SUMMARY = 500;
const HEADING = /^(#{2,4})\s+(.+?)\s*#*\s*$/;
const FENCE = /^(`{3,}|~{3,})/;
const EPIGRAPH = /^>\s*\[!(?:quote|epigraph)\][+-]?[ \t]*(.*)\n((?:>.*(?:\n|$))+)/i;

export function noteCard(title, markdown) {
  const body = markdown.trim();
  const opening = body.match(EPIGRAPH);
  if (!opening) return { title, paragraphs: clipParagraphs(summary(body, { paragraphs: 1 }), NOTE_SUMMARY) };
  const text = clip(plain(opening[2].replace(/^>\s?/gm, "")), NOTE_SUMMARY);
  const paragraphs = clipParagraphs(summary(body.slice(opening[0].length), { paragraphs: 1 }), NOTE_SUMMARY - text.length);
  return { title, epigraph: { text, by: plain(opening[1]) }, paragraphs };
}

export function headingCards(markdown) {
  const slugger = new GithubSlugger();
  for (const id of BACK_IDS) slugger.slug(id);
  const lines = markdown.split("\n");
  const out = {};
  let fence = null;
  lines.forEach((line, i) => {
    const f = line.match(FENCE)?.[1];
    if (f && (!fence || line.startsWith(fence))) fence = fence ? null : f;
    if (fence) return;
    const m = line.match(HEADING);
    if (!m) return;
    const title = m[2].replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/[*_`]/g, "");
    const id = slugger.slug(title);
    out[id] = { title, paragraphs: clipParagraphs(summary(lines.slice(i + 1).join("\n"), { paragraphs: 1 }), NOTE_SUMMARY) };
  });
  return out;
}

export function termCards(markdown) {
  const out = {};
  for (const [heading, definition] of glossaryEntries(markdown)) {
    const term = parseTerm(heading);
    if (!term) continue;
    const blocks = definition.split(/\n\s*\n|\n(?=\s*(?:\d+\.|[-*+])\s)/).map(plain);
    out[slug(heading)] = { title: term.word, type: term.type, paragraphs: clipParagraphs(blocks, NOTE_SUMMARY) };
  }
  return out;
}

export function linkCard({ url, text, card, annotation, deadSince }) {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const annotated = annotation ? clipParagraphs(summary(annotation), NOTE_SUMMARY) : [];
  const out = {
    title: card?.title || text,
    meta: card?.meta?.length ? card.meta : [domain],
    paragraphs: annotated.length ? annotated : card?.text ? [card.text] : [],
  };
  if (deadSince !== undefined)
    out.dead = deadSince ? `Archived copy. The original went dead on ${deadSince}.` : "Archived copy. The original is gone.";
  return out;
}

export function paragraphHtml(paragraph) {
  return paragraph
    .split(/(\$[^$\n]+\$)/)
    .map((part, i) => (i % 2 ? texToInlineSvg(part.slice(1, -1)) : escape(part)))
    .join("");
}

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function clipParagraphs(paragraphs, max) {
  const out = [];
  let left = max;
  for (const p of paragraphs) {
    if (left <= 0) break;
    const c = clip(p, left);
    out.push(c);
    left -= c.length;
    if (c.length < p.length) break;
  }
  return out;
}
