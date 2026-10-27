// The data behind link popovers, built once for the whole site and served as
// /popovers.json. Keys are link hrefs as they appear on the page: /slug/ and
// /slug/#heading for notes, and full URLs for external links. Titles and meta
// parts are plain text. Paragraphs are HTML from paragraphHtml, with inline
// math drawn as SVG; summaries already leave out display math and code.
import GithubSlugger from "github-slugger";
import { texToInlineSvg } from "./feed.js";
import { BACK_IDS } from "./rehype-sections.js";
import { clip, summary } from "./summary.js";

const NOTE_SUMMARY = 500;
const HEADING = /^(#{2,4})\s+(.+?)\s*#*\s*$/;
const FENCE = /^(`{3,}|~{3,})/;

// A note's card: its title and opening paragraphs, cut to about 500
// characters at a sentence boundary.
export function noteCard(title, markdown) {
  return { title, paragraphs: clipParagraphs(summary(markdown), NOTE_SUMMARY) };
}

// Each heading's first paragraph, keyed by the id rehypeSections gives it.
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

// An external link's card: the hand-written annotation when there is one,
// else the fetched card, else the link text and domain. A dead link says so.
export function linkCard({ url, text, card, annotation, deadSince }) {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const out = {
    title: card?.title || text,
    meta: card?.meta?.length ? card.meta : [domain],
    paragraphs: annotation ? summary(annotation) : card?.text ? [card.text] : [],
  };
  if (deadSince !== undefined)
    out.dead = deadSince ? `Archived copy. The original went dead on ${deadSince}.` : "Archived copy. The original is gone.";
  return out;
}

// A plain-text paragraph as HTML: text escaped, and $inline math$ as SVG.
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
