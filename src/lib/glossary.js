import { el, isElement, txt } from "./hast.js";

export const GLOSSARY = "glossary";
const TYPE = / \(([^()]+)\)$/;
const ENTRY = /^## +(.+?) *\n([\s\S]*?)(?=^#{1,6} |(?![\s\S]))/gm;
const DEFINITION = /^>\s*\[!definition\][+-]?[^\n]*\n((?:>.*(?:\n|$))*)/im;

export function parseTerm(heading) {
  const m = heading.match(TYPE);
  return m?.index ? { word: heading.slice(0, m.index), type: m[1] } : null;
}

export function glossaryEntries(markdown) {
  return new Map([...markdown.matchAll(ENTRY)].map((m) => [m[1], definitionBody(m[2])]));
}

function definitionBody(markdown) {
  const callout = markdown.match(DEFINITION);
  return callout ? callout[1].replace(/^>[ \t]?/gm, "").trim() : "";
}

export function rehypeGlossary() {
  return (tree, file) => {
    if (file?.stem !== GLOSSARY) return;
    for (const node of tree.children) if (isElement(node, "h2")) markType(node);
  };
}

export function markType(heading) {
  const last = heading.children.at(-1);
  const m = last?.type === "text" && last.value.match(TYPE);
  if (!m) return;
  last.value = `${last.value.slice(0, m.index)} `;
  heading.children.push(el("span", { className: ["term-type"] }, [txt(m[1])]));
}
