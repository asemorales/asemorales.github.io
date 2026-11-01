import { el, isElement, text, txt } from "./hast.js";

export const GLOSSARY = "glossary";
const TYPE = / \(([^()]+)\)$/;
const ENTRY = /^## +(.+?) *\n([\s\S]*?)(?=^#{1,6} |(?![\s\S]))/gm;

export function parseTerm(heading) {
  const m = heading.match(TYPE);
  return m?.index ? { word: heading.slice(0, m.index), type: m[1] } : null;
}

export function glossaryEntries(markdown) {
  return new Map([...markdown.matchAll(ENTRY)].map((m) => [m[1], m[2].trim()]));
}

export function rehypeGlossary() {
  return (tree, file) => {
    if (file?.stem !== GLOSSARY) return;
    const out = [];
    let etymology = null;
    for (const node of tree.children) {
      if (isElement(node) && /^h[1-6]$/.test(node.tagName)) etymology = null;
      if (isElement(node, "h2")) markType(node);
      if (isElement(node, "h3") && text(node).trim().toLowerCase() === "etymology") {
        etymology = el("div", { className: ["etymology"] });
        out.push(etymology);
      }
      (etymology?.children ?? out).push(node);
    }
    tree.children = out;
  };
}

function markType(heading) {
  const last = heading.children.at(-1);
  const m = last?.type === "text" && last.value.match(TYPE);
  if (!m) return;
  last.value = `${last.value.slice(0, m.index)} `;
  heading.children.push(el("span", { className: ["term-type"] }, [txt(m[1])]));
}
