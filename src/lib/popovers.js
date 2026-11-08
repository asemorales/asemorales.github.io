import { escapeText } from "entities";
import { slug } from "github-slugger";
import { glossaryEntries, parseTerm } from "./glossary.js";
import { headingSlugger } from "./headings.js";
import { domain } from "./links.js";
import { texToInlineSvg } from "./math.js";
import { clip, EPIGRAPH, plain, summary } from "./summary.js";

const NOTE_SUMMARY = 500;
const HEADING = /^(#{2,4})\s+(.+?)\s*#*\s*$/;
const FENCE = /^(`{3,}|~{3,})/;
const QUOTE = new RegExp(EPIGRAPH.source, "im");

export function noteCard(title, markdown) {
  const body = markdown.trim();
  const opening = body.match(EPIGRAPH);
  if (!opening) return { title, paragraphs: clipParagraphs(summary(body, { paragraphs: 1 }), NOTE_SUMMARY) };
  const text = clip(plain(opening[2].replace(/^>\s?/gm, "")), NOTE_SUMMARY);
  const paragraphs = clipParagraphs(summary(body.slice(opening[0].length), { paragraphs: 1 }), NOTE_SUMMARY - text.length);
  return { title, epigraph: { text, by: plain(opening[1]) }, paragraphs };
}

export function headingCards(markdown) {
  const slugger = headingSlugger();
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
    const [main, ...rest] = definition.split(/^#{1,6} +(.+?) *$/m);
    const [first, ...sections] = definitionParts(main);
    for (let i = 0; i < rest.length; i += 2) {
      const [part, ...quotes] = definitionParts(rest[i + 1]);
      sections.push({ title: rest[i], ...part }, ...quotes);
    }
    out[slug(heading)] = { title: term.word, type: term.type, ...first, sections };
  }
  return out;
}

function definitionParts(markdown) {
  const [lead, ...pieces] = markdown.split(QUOTE);
  const parts = [{ paragraphs: definitionBlocks(lead) }];
  for (let i = 0; i < pieces.length; i += 3) {
    const epigraph = { text: clip(plain(unquote(pieces[i + 1])), NOTE_SUMMARY), by: plain(pieces[i]) };
    parts.push({ epigraph, paragraphs: definitionBlocks(pieces[i + 2]) });
  }
  return parts.length > 1 && !parts[0].paragraphs.length ? parts.slice(1) : parts;
}

function definitionBlocks(markdown) {
  const body = markdown.trim();
  return body
    ? clipParagraphs(
        body.split(/\n\s*\n|\n(?=\s*(?:\d+\.|[-*+])\s)/).map((block) => plain(unquote(block).replace(/^\s*[-*+]\s/, "• "))),
        NOTE_SUMMARY,
      )
    : [];
}

const unquote = (markdown) => markdown.replace(/^>\s?/gm, "");

export function linkCard({ url, text, card, annotation, deadSince }) {
  const annotated = annotation ? clipParagraphs(summary(annotation.body), NOTE_SUMMARY) : [];
  const out = {
    title: annotation?.title || card?.title || text,
    meta: card?.meta?.length ? card.meta : [domain(url)],
    paragraphs: annotated.length ? annotated : card?.text ? [card.text] : [],
  };
  if (deadSince !== undefined) out.dead = "This redirects to an archived copy since the source is no longer available.";
  return out;
}

export function paragraphHtml(paragraph) {
  return paragraph
    .split(/(\$[^$\n]+\$)/)
    .map((part, i) => (i % 2 ? texToInlineSvg(part.slice(1, -1)) : escapeText(part)))
    .join("");
}

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
