import { domain } from "./links.js";

const papers = new Set(["arxiv", "doi"]);

function referenceName(card) {
  if (papers.has(card?.kind)) return [...card.meta.slice(0, -1), card.title].join(", ");
  return card?.meta?.length ? card.meta.join(", ") : null;
}

export function sourceEntry({ url, text, card, annotation, cited }) {
  return {
    text: (cited && referenceName(card)) || text,
    domain: domain(url),
    annotation: cited ? (annotation ?? null) : null,
  };
}
